/**
 * Unit tests for the x402 protocol client, driven by a mocked fetch.
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import { getDefaultAsset } from '@x402/evm'
import type { Address } from 'viem'
import { createX402Protocol, formatUsdc, X402Error } from '../src/protocol.ts'
import type { X402ProtocolDeps } from '../src/protocol.ts'

const NETWORK = 'eip155:8453'
const ASSET = getDefaultAsset(NETWORK)
const PAY_TO = '0x0000000000000000000000000000000000000001' as Address

/** A minimal Response the x402 client accepts: status, headers, json/text body. */
function mockResponse(status: number, headers: Record<string, string>, body: unknown): Response {
  return {
    status,
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => (typeof body === 'string' ? JSON.parse(body) as unknown : body),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    clone() {
      return this
    },
  } as unknown as Response
}

function base64(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64')
}

/** The v2 exact-scheme challenge the mocked server returns on 402. */
function paymentRequired(overrides: Record<string, unknown> = {}): unknown {
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
    ...overrides,
  }
}

/** The settlement the mocked server returns after a valid payment. */
function settleResponse(overrides: Record<string, unknown> = {}): unknown {
  return {
    success: true,
    transaction: '0xabc',
    payer: '0xdef',
    network: NETWORK,
    ...overrides,
  }
}

/** A fetch that serves a scripted sequence of responses. */
function scriptedFetch(responses: Array<() => Response>): typeof fetch {
  let index = 0
  return (async (_url: string, _init?: RequestInit) => {
    const current = responses[Math.min(index, responses.length - 1)]
    const response = current !== undefined ? current() : mockResponse(500, {}, {})
    index += 1
    return response
  }) as typeof fetch
}

function deps(fetchImpl: typeof fetch, resolveKey: () => Promise<string | undefined> = async () => '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'): X402ProtocolDeps {
  return { fetch: fetchImpl, rpcUrl: 'https://rpc.example.test', network: NETWORK, resolveKey }
}

const KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

describe('formatUsdc', () => {
  it('formats raw amounts with six fixed decimals', () => {
    expect(formatUsdc('1000', 6)).toBe('0.001000')
    expect(formatUsdc('1000000', 6)).toBe('1.000000')
    expect(formatUsdc('1', 6)).toBe('0.000001')
  })
})

describe('estimate', () => {
  it('reports a free API without a requirement', async () => {
    const protocol = createX402Protocol(deps(scriptedFetch([() => mockResponse(200, {}, { ok: true })])))
    const probe = await protocol.estimate('https://free.example.test')
    expect(probe.status).toBe(200)
    expect(probe.requirement).toBeUndefined()
  })

  it('parses a 402 challenge into a normalized requirement', async () => {
    const required = paymentRequired()
    const protocol = createX402Protocol(deps(scriptedFetch([() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {})])))
    const probe = await protocol.estimate('https://paid.example.test')
    expect(probe.status).toBe(402)
    expect(probe.requirement).toMatchObject({
      scheme: 'exact',
      network: NETWORK,
      amountRaw: '1000',
      amountUsdc: '0.001000',
      payTo: PAY_TO,
      resource: 'https://api.example.test/data',
    })
  })

  it('fails loud when the server asks for a network the wallet does not pay', async () => {
    const required = paymentRequired({ accepts: [{ ...((paymentRequired() as { accepts: Array<Record<string, unknown>> }).accepts[0]!), network: 'eip155:1' }] })
    const protocol = createX402Protocol(deps(scriptedFetch([() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {})])))
    await expect(protocol.estimate('https://other.test')).rejects.toMatchObject({ code: 'network-unsupported' })
  })

  it('fails loud when the server asks for an asset the wallet does not hold', async () => {
    const required = paymentRequired({ accepts: [{ ...((paymentRequired() as { accepts: Array<Record<string, unknown>> }).accepts[0]!), asset: '0x0000000000000000000000000000000000000000' }] })
    const protocol = createX402Protocol(deps(scriptedFetch([() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {})])))
    await expect(protocol.estimate('https://other.test')).rejects.toMatchObject({ code: 'asset-unsupported' })
  })

  it('fails loud for an x402 v1 server', async () => {
    const required = { ...(paymentRequired() as object), x402Version: 1 }
    const protocol = createX402Protocol(deps(scriptedFetch([() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {})])))
    await expect(protocol.estimate('https://v1.test')).rejects.toMatchObject({ code: 'version-unsupported' })
  })
})

describe('pay', () => {
  it('returns a free 200 response without touching the wallet', async () => {
    let resolved = false
    const protocol = createX402Protocol(deps(
      scriptedFetch([() => mockResponse(200, {}, { data: 1 })]),
      async () => {
        resolved = true
        return undefined
      },
    ))
    const receipt = await protocol.pay('https://free.test', { method: 'GET' }, 1)
    expect(receipt.paymentStatus).toBe('none')
    expect(receipt.status).toBe(200)
    expect(resolved).toBe(false)
  })

  it('signs, retries with the payment signature, and parses the settlement', async () => {
    const required = paymentRequired()
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64(settleResponse()), 'content-type': 'application/json' }, { data: 'paid' }),
    ]
    const protocol = createX402Protocol(deps(scriptedFetch(responses)))
    let confirmed: string | undefined
    const receipt = await protocol.pay('https://paid.test', { method: 'GET' }, 1, async (requirement) => {
      confirmed = requirement.amountUsdc
    })
    expect(confirmed).toBe('0.001000')
    expect(receipt.paymentStatus).toBe('settled')
    expect(receipt.transaction).toBe('0xabc')
    expect(receipt.payer).toBe('0xdef')
    expect(receipt.body).toEqual({ data: 'paid' })
  })

  it('aborts before signing when the cost exceeds the cap', async () => {
    const required = paymentRequired()
    let calls = 0
    const protocol = createX402Protocol(deps(scriptedFetch([
      () => {
        calls += 1
        return mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {})
      },
      () => mockResponse(200, {}, {}),
    ])))
    await expect(protocol.pay('https://paid.test', { method: 'GET' }, 0.0005)).rejects.toMatchObject({ code: 'cap-exceeded' })
    expect(calls).toBe(1)
  })

  it('fails with wallet-not-configured when the key is missing', async () => {
    const required = paymentRequired()
    const protocol = createX402Protocol(deps(
      scriptedFetch([() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {})]),
      async () => undefined,
    ))
    await expect(protocol.pay('https://paid.test', { method: 'GET' }, 1)).rejects.toMatchObject({ code: 'wallet-not-configured' })
  })

  it('surfaces settle failures as settle_failed', async () => {
    const required = paymentRequired()
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64({ ...(settleResponse() as object), success: false, errorReason: 'no-funds' }) }, {}),
    ]
    const protocol = createX402Protocol(deps(scriptedFetch(responses)))
    const receipt = await protocol.pay('https://paid.test', { method: 'GET' }, 1)
    expect(receipt.paymentStatus).toBe('settle_failed')
  })

  it('reports payment_required when the retry still asks for payment', async () => {
    const required = paymentRequired()
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {}),
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {}),
    ]
    const protocol = createX402Protocol(deps(scriptedFetch(responses)))
    const receipt = await protocol.pay('https://paid.test', { method: 'GET' }, 1)
    expect(receipt.paymentStatus).toBe('payment_required')
    expect(receipt.transaction).toBeUndefined()
    expect(receipt.payer).toBeUndefined()
  })

  it('reuses the registered scheme for a second paid call', async () => {
    const required = paymentRequired()
    const responses = [
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64(settleResponse()), 'content-type': 'application/json' }, { data: 1 }),
      () => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {}),
      () => mockResponse(200, { 'PAYMENT-RESPONSE': base64(settleResponse()), 'content-type': 'application/json' }, { data: 2 }),
    ]
    const protocol = createX402Protocol(deps(scriptedFetch(responses)))
    await protocol.pay('https://paid.test', { method: 'GET' }, 1)
    const receipt = await protocol.pay('https://paid.test', { method: 'GET' }, 1)
    expect(receipt.paymentStatus).toBe('settled')
  })

  it('falls back to the URL when the server gives no description', async () => {
    const required = paymentRequired({ resource: { url: 'https://api.example.test/data' } })
    const protocol = createX402Protocol(deps(scriptedFetch([() => mockResponse(402, { 'PAYMENT-REQUIRED': base64(required) }, {})])))
    const probe = await protocol.estimate('https://paid.test')
    expect(probe.requirement?.description).toBe('x402 resource')
  })

  it('rejects a blank key like a missing key', async () => {
    const protocol = createX402Protocol(deps(scriptedFetch([]), async () => '   '))
    await expect(protocol.address()).rejects.toMatchObject({ code: 'wallet-not-configured' })
  })
})

describe('malformed challenges', () => {
  it('fails loud on a 402 without a recognizable challenge', async () => {
    const protocol = createX402Protocol(deps(scriptedFetch([() => mockResponse(402, {}, 'not json')])))
    await expect(protocol.estimate('https://broken.test')).rejects.toThrow(/Invalid payment required response/)
  })
})

describe('wallet', () => {
  it('derives the address from the resolved key', async () => {
    const protocol = createX402Protocol(deps(scriptedFetch([]), async () => KEY))
    await expect(protocol.address()).resolves.toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  })

  it('throws wallet-not-configured without a key', async () => {
    const protocol = createX402Protocol(deps(scriptedFetch([]), async () => undefined))
    await expect(protocol.address()).rejects.toMatchObject({ code: 'wallet-not-configured' })
  })
})

describe('balance', () => {
  it('returns the human USDC balance through the injected RPC', async () => {
    // The viem public client routes through the injected fetch's custom transport.
    const rpc = scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, { jsonrpc: '2.0', id: 1, result: `0x${'3e8'.padStart(64, '0')}` })])
    const protocol = createX402Protocol({ ...deps(rpc, async () => KEY), rpcUrl: 'https://rpc.example.test' })
    const address = await protocol.address()
    await expect(protocol.balance(address)).resolves.toBe('0.001000')
  })

  it('surfaces RPC errors', async () => {
    const rpc = scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, { jsonrpc: '2.0', id: 1, error: { message: 'boom' } })])
    const protocol = createX402Protocol({ ...deps(rpc, async () => KEY), rpcUrl: 'https://rpc.example.test' })
    const address = await protocol.address()
    await expect(protocol.balance(address)).rejects.toThrow(/RPC eth_call failed: boom/)
  })

  it('falls back to a generic message for an RPC error without one', async () => {
    const rpc = scriptedFetch([() => mockResponse(200, { 'content-type': 'application/json' }, { jsonrpc: '2.0', id: 1, error: {} })])
    const protocol = createX402Protocol({ ...deps(rpc, async () => KEY), rpcUrl: 'https://rpc.example.test' })
    const address = await protocol.address()
    await expect(protocol.balance(address)).rejects.toThrow(/RPC eth_call failed: unknown error/)
  })
})

describe('X402Error', () => {
  it('carries its code and message', () => {
    const error = new X402Error('cap-exceeded', 'too much')
    expect(error.code).toBe('cap-exceeded')
    expect(error.message).toBe('too much')
    expect(error.name).toBe('X402Error')
  })
})
