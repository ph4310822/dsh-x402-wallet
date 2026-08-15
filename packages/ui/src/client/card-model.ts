/** Pure projection of one `x402_pay` call from the frozen call/result node. */

import type { ToolCallBlock } from '@deepseek-ai/dsh-client-runtime/client'

/** One payment call's material, derived purely from the call/result slice. */
export interface X402CallView {
  url: string | null
  maxCostUsdc: number | null
  paymentStatus: 'settled' | 'settle_failed' | 'payment_required' | 'none' | null
  transaction: string | null
  isError: boolean
}

/** Parse the call arguments from the frozen call head. */
function parseArgs(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

/** Parse the rendered result text for the receipt facts the card shows. */
function parseResult(block: ToolCallBlock): { paymentStatus: X402CallView['paymentStatus']; transaction: string | null } {
  if (!('kind' in block)) return { paymentStatus: null, transaction: null }
  const text = block.content
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('\n')
  const status = /paymentStatus:\s*(\w+)/.exec(text)?.[1]
  const transaction = /transaction:\s*(0x[0-9a-fA-F]+)/.exec(text)?.[1] ?? null
  const known = status === 'settled' || status === 'settle_failed' || status === 'payment_required' || status === 'none'
  return { paymentStatus: known ? status : null, transaction }

}

/**
 * Derive the card's material from the frozen node — a pure function of the log slice.
 * @param block - frozen running call or settled result node.
 * @returns the payment call's material.
 */
export function x402CallView(block: ToolCallBlock): X402CallView {
  const settled = 'kind' in block
  const args = settled ? (block.call?.argsRaw ?? '{}') : block.argsRaw
  const parsed = parseArgs(args)
  const result = parseResult(block)
  return {
    url: typeof parsed.url === 'string' ? parsed.url : null,
    maxCostUsdc: typeof parsed.maxCostUsdc === 'number' ? parsed.maxCostUsdc : null,
    paymentStatus: result.paymentStatus,
    transaction: result.transaction,
    isError: settled ? block.isError : false,
  }
}
