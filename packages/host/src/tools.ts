/**
 * Model-facing x402 tools: discover, estimate, balance, and pay.
 * @module @danielng23/dsh-x402/tools
 */

import type { Context } from '@deepseek-ai/cordis'
import type { ToolExecution } from '@deepseek-ai/dsh-tools'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { JsonValue } from '@deepseek-ai/dsh-session/types'
import type { X402Service } from './index.ts'

/** One paid-call request the tool layer forwards to the service. */
export interface X402PayToolArgs {
  url: string
  maxCostUsdc?: number | undefined
  method?: string | undefined
  headers?: Record<string, string> | undefined
  body?: JsonValue | undefined
}

function requireAgent(exec: ToolExecution): Agent {
  if (exec.agent === undefined) throw new Error('x402 tools require an Agent-backed session')
  return exec.agent
}

function jsonRender(_args: Record<string, unknown>, value: JsonValue): Array<{ type: 'text'; text: string }> {
  return [{ type: 'text', text: JSON.stringify(value, null, 2) }]
}

/**
 * Register every model-facing x402 tool on the given context.
 * @param ctx - context carrying the tool registry.
 * @param service - x402 service the tools call.
 */
export function registerX402Tools(ctx: Context, service: X402Service): void {
  ctx.tools.register(defineTool({
    name: 'x402_discover',
    description:
      'List live x402-enabled paid APIs from the catalog. Optionally filter by keyword (matched against '
      + 'descriptions and URLs) or by CAIP-2 network (e.g. eip155:8453). Call this before x402_estimate to '
      + 'find an API for a task.',
    parameters: {
      keyword: { type: 'string', description: 'Filter by a keyword in the API description or URL.' },
      network: { type: 'string', description: 'Filter by CAIP-2 network identifier.' },
    },
    output: { schema: { type: 'json' }, render: jsonRender },
    execute(args, _exec): Promise<JsonValue> {
      return service.discover(args.keyword, args.network) as unknown as Promise<JsonValue>
    },
  }))

  ctx.tools.register(defineTool({
    name: 'x402_estimate',
    description:
      'Probe one URL for its x402 payment requirement without paying. A free API answers 200 and needs no '
      + 'payment; a paid API answers 402 with a requirement naming scheme, network, USDC amount, and recipient. '
      + 'Use this before x402_pay to learn the exact cost.',
    parameters: {
      url: { type: 'string', required: true, description: 'Resource URL to probe for a payment requirement.' },
      method: { type: 'string', description: 'HTTP method for the probe; defaults to GET.' },
    },
    output: { schema: { type: 'json' }, render: jsonRender },
    execute(args, _exec): Promise<JsonValue> {
      return service.estimate(args.url, args.method) as unknown as Promise<JsonValue>
    },
  }))

  ctx.tools.register(defineTool({
    name: 'x402_balance',
    description:
      'Read the payment wallet: whether it is configured, its address, and its USDC balance on the payment '
      + 'network. Call this before any paid call; a failed balance read means the RPC is unreachable, not that '
      + 'funds are gone.',
    parameters: {},
    output: { schema: { type: 'json' }, render: jsonRender },
    execute(_args, _exec): Promise<JsonValue> {
      return service.wallet() as unknown as Promise<JsonValue>
    },
  }))

  ctx.tools.register(defineTool({
    name: 'x402_pay',
    description:
      'Pay and call one x402-enabled URL in one step. Probes the URL, enforces maxCostUsdc (the call aborts '
      + 'before paying when the cost exceeds it), asks the user for approval with the exact amount, signs the '
      + 'payment with the wallet key, retries with the proof, and returns the API response plus the settlement '
      + 'receipt. A 200 response needs no payment and is returned directly. Default maxCostUsdc is the '
      + 'configured default; do not raise it without explicit user agreement.',
    parameters: {
      url: { type: 'string', required: true, description: 'Resource URL to pay for and call.' },
      maxCostUsdc: { type: 'number', description: 'Hard spending cap in USDC; the call aborts before paying when exceeded.' },
      method: { type: 'string', description: 'HTTP method for the call; defaults to GET.' },
      headers: { type: 'json', description: 'Optional request headers to send with the call.' },
      body: { type: 'json', description: 'Optional JSON request body for the call.' },
    },
    output: {
      schema: { type: 'json' },
      render: (_args, value) => {
        const receipt = value as { paymentStatus: string; status?: number; url?: string; transaction?: string }
        return [{ type: 'text', text: [
          `paymentStatus: ${receipt.paymentStatus}`,
          `http: ${String(receipt.status)}`,
          ...(receipt.transaction === undefined ? [] : [`transaction: ${receipt.transaction}`]),
          '',
          JSON.stringify(value, null, 2),
        ].join('\n') }]
      },
    },
    execute(args, exec): Promise<JsonValue> {
      return service.payForAgent({
        url: args.url,
        maxCostUsdc: args.maxCostUsdc,
        method: args.method,
        headers: args.headers as Record<string, string> | undefined,
        body: args.body,
        agent: requireAgent(exec),
        callId: exec.callId,
        signal: exec.signal,
      }) as unknown as Promise<JsonValue>
    },
  }))
}
