/**
 * Unit tests for the x402 service: tools surface, wallet state, payment
 * history, and the approval gate, driven by a mocked context and fetch.
 * @vitest-environment node
 */

import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { getDefaultAsset } from '@x402/evm'
import { X402Service } from '../src/index.ts'
import { registerX402Tools } from '../src/tools.ts'
import type { X402PaymentRecord } from '../src/types.ts'

const NETWORK = 'eip155:8453'
const ASSET = getDefaultAsset(NETWORK)
const KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const PAY_TO = '0x0000000000000000000000000000000000000001'
const ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

/** Minimal Response used by both the protocol and the catalog mocks. */
function mockResponse(status: number, headers: Record<string, string>, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name: string) => headers[name] ?? null } as unknown as Headers,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    clone() {
      return this
    },
  } as unknown as Response
}

function base64(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64')
}

function paymentRequired(): unknown {
  return {
    x402Version: 2,
    resource: { url: 'https://api.example.test/data', description: 'test data' },
    accepts: [{
      scheme: 'exact',
      network: NETWORK,
      asset: ASSET.address,
      amount: '1000',
      payTo: PAY_TO,
      maxTimeoutSeconds: 60,
      extra: { name: ASSET.name, version: ASSET.version },
    }],
  }
}

function settleBody(overrides: Record<string, unknown> = {}): unknown {
  return { success: true, transaction: '0xabc', payer: ADDRESS, network: NETWORK, ...overrides }
}

/** A fetch that serves a scripted sequence of responses. */
function scriptedFetch(responses: Array<() => Response>, onCall?: (url: string, init?: RequestInit) => void): typeof fetch {
  let index = 0
  return (async (url: string, init?: RequestInit) => {
    onCall?.(url, init)
    const current = responses[Math.min(index, responses.length - 1)]
    const response = current !== undefined ? current() : mockResponse(500, {}, {})
    index += 1
    return response
  }) as typeof fetch
}

interface Harness {
  ctx: Context
  service: X402Service
  approvalCalls: Array<{ toolName: string; reason?: string; signal?: AbortSignal }>
  payments: X402PaymentRecord[]
  approvalOutcome: string
  approvalRequired: boolean
}

function harness(
  fetchImpl: typeof fetch,
  key: string | undefined,
  approvalOutcome = 'allowed-once',
  approvalRequired = true,
): Harness {
  const ctx = new Context()
  const approvalCalls: Array<{ toolName: string; reason?: string; signal?: AbortSignal }> = []
  const payments: X402PaymentRecord[] = []
  ctx.provide('credentials', {
    resolve: async () => (key === undefined ? undefined : { value: key, source: 'test' }),
    describe: async () => ({ configured: key !== undefined, source: 'test', writable: false }),
  } as never)
  ctx.provide('approval', {
    request: async (request: { toolName: string; reason?: string; signal?: AbortSignal }) => {
      approvalCalls.push(request)
      return approvalOutcome
    },
  } as never)
  ctx.provide('tools', { register: () => () => {} } as never)
  ctx.provide('systemPrompt', { section: () => {} } as never)
  ctx.on('x402/payment', (payment) => {
    payments.push(payment)
  })
  const service = new X402Service(ctx, { approvalRequired }, { fetch: fetchImpl })
  return { ctx, service, approvalCalls, payments, approvalOutcome, approvalRequired }
}

describe('discover', () => {
  it('lists live catalog entries, filtered by keyword and network', async () => {
    const catalog = {
      services: [
        { resource: 'https://a.test/x', description: 'weather data', network: NETWORK, price_usdc: '0.001000 USDC', live: true },
        { resource: 'https://b.test/y', description: 'stock quotes', network: NETWORK, price_usdc: '0.002000 USDC', live: true },
        { resource: 'https://c.test/z', description: 'weather radar', network: 'eip155:1', live: true },
        { resource: 'https://d.test/w', description: 'offline weather', network: NETWORK, live: false },
      ],
    }
    const { service } = harness(scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, catalog)]), KEY)
    const entries = await service.discover('weather', NETWORK)
    expect(entries.map(entry => entry.resource)).toEqual(['https://a.test/x'])
    expect(entries[0]?.priceUsdc).toBe('0.001000 USDC')
  })

  it('matches keywords against resource URLs and fills defaults for sparse entries', async () => {
    const catalog = {
      services: [
        { resource: 'https://weather.example/x' },
        { resource: 'https://plain.example/x', description: 'plain data' },
      ],
    }
    const { service } = harness(scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, catalog)]), KEY)
    const entries = await service.discover('weather')
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      resource: 'https://weather.example/x',
      description: '',
      network: NETWORK,
      priceUsdc: '',
      scheme: 'exact',
      x402Version: 2,
    })
  })

  it('keeps filtering entries whose description is absent', async () => {
    const catalog = {
      services: [
        { resource: 'https://weather.example/x' },
        { resource: 'https://other.example/y' },
      ],
    }
    const { service } = harness(scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, catalog)]), KEY)
    const entries = await service.discover('weather')
    expect(entries.map(entry => entry.resource)).toEqual(['https://weather.example/x'])
  })

  it('returns an empty list when the catalog has no services', async () => {
    const { service } = harness(scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, {})]), KEY)
    await expect(service.discover()).resolves.toEqual([])
  })

  it('fails loud when the catalog is unreachable', async () => {
    const { service } = harness(scriptedFetch([() => mockResponse(503, {}, {})]), KEY)
    await expect(service.discover()).rejects.toThrow(/catalog unreachable: HTTP 503/)
  })
})

describe('estimate', () => {
  it('reports a free API', async () => {
    const { service } = harness(scriptedFetch([() => mockResponse(200, {}, { ok: true })]), KEY)
    await expect(service.estimate('https://free.test')).resolves.toEqual({ requiresPayment: false, status: 200 })
  })

  it('normalizes a 402 challenge', async () => {
    const { service } = harness(scriptedFetch([() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {})]), KEY)
    const result = await service.estimate('https://paid.test')
    expect(result).toMatchObject({
      requiresPayment: true,
      requirement: { scheme: 'exact', network: NETWORK, amountUsdc: '0.001000', payTo: PAY_TO },
    })
  })
})

describe('wallet', () => {
  it('reports unconfigured without a key', async () => {
    const { service } = harness(scriptedFetch([]), undefined)
    await expect(service.wallet()).resolves.toEqual({ configured: false, network: NETWORK })
  })

  it('reports address and balance when configured', async () => {
    const fetchImpl = scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, {
      jsonrpc: '2.0',
      id: 1,
      result: `0x${'3e8'.padStart(64, '0')}`,
    })])
    const { service } = harness(fetchImpl, KEY)
    await expect(service.wallet()).resolves.toMatchObject({ configured: true, address: ADDRESS, usdcBalance: '0.001000' })
  })
})

describe('payments', () => {
  it('starts empty', async () => {
    const { service } = harness(scriptedFetch([]), KEY)
    await expect(service.payments()).resolves.toEqual([])
  })

  it('records settled payments newest first and broadcasts the event', async () => {
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64(settleBody()), 'content-type': 'application/json' }, { data: 'paid' }),
    ]
    const { service, payments } = harness(scriptedFetch(responses), KEY)
    const agent = {} as never
    const receipt = await service.payForAgent({ url: 'https://paid.test', agent, callId: 'call-1' as never })
    expect(receipt.paymentStatus).toBe('settled')
    const history = await service.payments()
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ url: 'https://paid.test', amountUsdc: '0.001000', status: 'settled', transaction: '0xabc' })
    expect(payments).toHaveLength(1)
    expect(payments[0]?.id).toBe(history[0]?.id)
  })

  it('does not record free calls', async () => {
    const { service } = harness(scriptedFetch([() => mockResponse(200, {}, { ok: true })]), KEY)
    await service.payForAgent({ url: 'https://free.test', agent: {} as never })
    await expect(service.payments()).resolves.toEqual([])
  })
})

describe('payForAgent', () => {
  it('asks for approval with the exact amount before signing', async () => {
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64(settleBody()), 'content-type': 'application/json' }, { data: 'paid' }),
    ]
    const { service, approvalCalls } = harness(scriptedFetch(responses), KEY)
    await service.payForAgent({ url: 'https://paid.test', agent: {} as never, callId: 'call-7' as never })
    expect(approvalCalls).toHaveLength(1)
    expect(approvalCalls[0]?.toolName).toBe('x402_pay')
    expect(approvalCalls[0]?.reason).toContain('0.001000 USDC')
    expect(approvalCalls[0]?.reason).toContain(PAY_TO)
  })

  it('aborts with no payment when the user rejects', async () => {
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {}),
      () => mockResponse(200, {}, {}),
    ]
    const { service, payments } = harness(scriptedFetch(responses), KEY, 'rejected')
    await expect(service.payForAgent({ url: 'https://paid.test', agent: {} as never })).rejects.toMatchObject({ code: 'rejected' })
    await expect(service.payments()).resolves.toEqual([])
    expect(payments).toHaveLength(0)
  })

  it('skips approval when approvalRequired is false', async () => {
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64(settleBody()), 'content-type': 'application/json' }, { data: 'paid' }),
    ]
    const { service, approvalCalls } = harness(scriptedFetch(responses), KEY, 'allowed-once', false)
    await service.payForAgent({ url: 'https://paid.test', agent: {} as never })
    expect(approvalCalls).toHaveLength(0)
  })

  it('enforces an explicit cap override', async () => {
    const responses = [() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {})]
    const { service } = harness(scriptedFetch(responses), KEY)
    await expect(service.payForAgent({ url: 'https://paid.test', agent: {} as never, maxCostUsdc: 0.0005 }))
      .rejects.toMatchObject({ code: 'cap-exceeded' })
  })

  it('passes headers and body through to the call', async () => {
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64(settleBody()), 'content-type': 'application/json' }, { data: 'paid' }),
    ]
    const inits: RequestInit[] = []
    const { service } = harness(scriptedFetch(responses, (_url, init) => {
      if (init !== undefined) inits.push(init)
    }), KEY)
    await service.payForAgent({
      url: 'https://paid.test',
      agent: {} as never,
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { query: 'hello' },
    })
    const retry = inits[1]
    expect(retry?.method).toBe('POST')
    expect((retry?.headers as Record<string, string> | undefined)?.authorization).toBe('Bearer x')
    expect(retry?.body).toBe('{"query":"hello"}')
  })

  it('treats a cancelled approval as a safe rejection', async () => {
    const responses = [() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {})]
    const { service } = harness(scriptedFetch(responses), KEY, 'cancelled')
    await expect(service.payForAgent({ url: 'https://paid.test', agent: {} as never }))
      .rejects.toMatchObject({ code: 'rejected' })
  })

  it('treats an unavailable approval as a safe rejection', async () => {
    const responses = [() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {})]
    const { service } = harness(scriptedFetch(responses), KEY, 'unavailable')
    await expect(service.payForAgent({ url: 'https://paid.test', agent: {} as never }))
      .rejects.toMatchObject({ code: 'rejected' })
  })

  it('records a failed settle without a transaction', async () => {
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64({ ...(settleBody() as object), success: false, errorReason: 'no-funds', transaction: undefined }) }, {}),
    ]
    const { service } = harness(scriptedFetch(responses), KEY)
    const receipt = await service.payForAgent({ url: 'https://paid.test', agent: {} as never })
    expect(receipt.paymentStatus).toBe('settle_failed')
    const history = await service.payments()
    expect(history[0]).toMatchObject({ status: 'failed', amountUsdc: '0.001000' })
    expect(history[0]?.transaction).toBeUndefined()
  })

  it('caps the payment history ring at its depth', async () => {
    const responses: Array<() => Response> = []
    for (let i = 0; i < 101; i += 1) {
      responses.push(() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {}))
      responses.push(() => mockResponse(200, { 'PAYMENT-RESPONSE': base64(settleBody()), 'content-type': 'application/json' }, { data: i }))
    }
    const { service } = harness(scriptedFetch(responses), KEY)
    for (let i = 0; i < 101; i += 1) {
      await service.payForAgent({ url: `https://paid.test/${i}`, agent: {} as never })
    }
    const history = await service.payments()
    expect(history).toHaveLength(100)
    expect(history[0]?.url).toBe('https://paid.test/100')
  })

  it('forwards the asking signal to the approval request', async () => {
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64(settleBody()), 'content-type': 'application/json' }, { data: 'paid' }),
    ]
    const { service, approvalCalls } = harness(scriptedFetch(responses), KEY)
    const signal = new AbortController().signal
    await service.payForAgent({ url: 'https://paid.test', agent: {} as never, signal })
    expect(approvalCalls[0]?.signal).toBe(signal)
  })
})

describe('mounting', () => {
  it('registers the tools and prompt section when started as a plugin', async () => {
    const { Context } = await import('@deepseek-ai/cordis')
    const ToolRegistry = (await import('@deepseek-ai/dsh-tools')).default
    const SystemPrompt = (await import('@deepseek-ai/dsh-system-prompt')).default
    const ctx = new Context()
    await ctx.plugin(ToolRegistry)
    await ctx.plugin(SystemPrompt)
    ctx.provide('credentials', {
      resolve: async () => undefined,
      describe: async () => ({ configured: false, source: 'test', writable: false }),
    } as never)
    ctx.provide('approval', { request: async () => 'unavailable' } as never)
    await ctx.plugin(X402Service, { approvalRequired: true })
    expect(ctx.tools.get('x402_pay')).toBeDefined()
    expect(ctx.tools.get('x402_estimate')).toBeDefined()
    expect(ctx.tools.get('x402_balance')).toBeDefined()
    expect(ctx.tools.get('x402_discover')).toBeDefined()
    expect(ctx.x402).toBeDefined()
  })

  it('rejects x402_pay without an agent', async () => {
    const { Context } = await import('@deepseek-ai/cordis')
    const ToolRegistry = (await import('@deepseek-ai/dsh-tools')).default
    const SystemPrompt = (await import('@deepseek-ai/dsh-system-prompt')).default
    const ctx = new Context()
    await ctx.plugin(ToolRegistry)
    await ctx.plugin(SystemPrompt)
    ctx.provide('credentials', { resolve: async () => undefined, describe: async () => ({ configured: false, source: 'test', writable: false }) } as never)
    ctx.provide('approval', { request: async () => 'unavailable' } as never)
    await ctx.plugin(X402Service, { approvalRequired: true })
    const result = await ctx.tools.execute({
      name: 'x402_pay',
      arguments: { url: 'https://paid.test' },
      callId: 'call-1' as never,
      signal: new AbortController().signal,
    })
    expect(result).toMatchObject({ isError: true })
    expect(JSON.stringify(result)).toContain('require an Agent')
  })
})

describe('tool execution', () => {
  async function mounted(fetchImpl: typeof fetch, approvalOutcome = 'allowed-once', key: string | undefined = KEY) {
    const { Context } = await import('@deepseek-ai/cordis')
    const ToolRegistry = (await import('@deepseek-ai/dsh-tools')).default
    const SystemPrompt = (await import('@deepseek-ai/dsh-system-prompt')).default
    const ctx = new Context()
    await ctx.plugin(ToolRegistry)
    await ctx.plugin(SystemPrompt)
    ctx.provide('credentials', {
      resolve: async () => (key === undefined ? undefined : { value: key, source: 'test' }),
      describe: async () => ({ configured: key !== undefined, source: 'test', writable: false }),
    } as never)
    ctx.provide('approval', { request: async () => approvalOutcome } as never)
    const service = new X402Service(ctx, {}, { fetch: fetchImpl })
    registerX402Tools(ctx, service)
    return ctx
  }

  const agent = { id: 'S-a' } as never
  const call = (name: string, args: unknown) => ({
    name,
    arguments: args,
    agent,
    callId: `call-${name}` as never,
    signal: new AbortController().signal,
  })

  it('executes x402_discover', async () => {
    const catalog = { services: [{ resource: 'https://a.test/x', description: 'weather data', network: NETWORK, price_usdc: '0.001000 USDC', live: true }] }
    const ctx = await mounted(scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, catalog)]))
    const result = await ctx.tools.execute(call('x402_discover', { keyword: 'weather' }))
    expect(result.isError).toBe(false)
    expect(JSON.stringify(result.value)).toContain('https://a.test/x')
  })

  it('executes x402_estimate', async () => {
    const ctx = await mounted(scriptedFetch([() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {})]))
    const result = await ctx.tools.execute(call('x402_estimate', { url: 'https://paid.test' }))
    expect(result.isError).toBe(false)
    expect(JSON.stringify(result.value)).toContain('requiresPayment')
  })

  it('executes x402_balance', async () => {
    const rpc = scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, {
      jsonrpc: '2.0',
      id: 1,
      result: `0x${'3e8'.padStart(64, '0')}`,
    })])
    const ctx = await mounted(rpc)
    const result = await ctx.tools.execute(call('x402_balance', {}))
    expect(result.isError).toBe(false)
    expect(JSON.stringify(result.value)).toContain('0.001000')
  })

  it('executes x402_pay end to end', async () => {
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64(settleBody()), 'content-type': 'application/json' }, { data: 'paid' }),
    ]
    const ctx = await mounted(scriptedFetch(responses))
    const result = await ctx.tools.execute(call('x402_pay', { url: 'https://paid.test', maxCostUsdc: 0.5 }))
    expect(result.isError).toBe(false)
    expect(JSON.stringify(result.value)).toContain('settled')
    expect(JSON.stringify(result.value)).toContain('0xabc')
  })

  it('surfaces a cap error through x402_pay', async () => {
    const ctx = await mounted(scriptedFetch([() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(paymentRequired()) }, {})]))
    const result = await ctx.tools.execute(call('x402_pay', { url: 'https://paid.test', maxCostUsdc: 0.0005 }))
    expect(result.isError).toBe(true)
    expect(JSON.stringify(result)).toContain('cap')
  })

  it('renders a free x402_pay call without a transaction line', async () => {
    const ctx = await mounted(scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, { data: 1 })]))
    const result = await ctx.tools.execute(call('x402_pay', { url: 'https://free.test' }))
    expect(result.isError).toBe(false)
    const value = JSON.stringify(result.value)
    expect(value).toContain('"paymentStatus":"none"')
    expect(value).not.toContain('transaction')
  })
})
