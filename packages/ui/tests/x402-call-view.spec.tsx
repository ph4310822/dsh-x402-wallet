/**
 * Pure card-model tests: `x402CallView` is a deterministic projection of the
 * frozen call/result node.
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import type { ToolCallBlock } from '@deepseek-ai/dsh-client-runtime/client'
import { x402CallView } from '../src/client/card-model.ts'

function runningCall(overrides: Partial<ToolCallBlock> = {}): ToolCallBlock {
  return {
    callId: 'call-1',
    name: 'x402_pay',
    argsRaw: JSON.stringify({ url: 'https://paid.test', maxCostUsdc: 0.5 }),
    turn: 1,
    step: 1,
    time: 0,
    callView: null,
    subCalls: [],
    ...overrides,
  }
}

function settledResult(overrides: Partial<ToolCallBlock> = {}): ToolCallBlock {
  return {
    kind: 'tool-result',
    seq: 1,
    time: 0,
    callId: 'call-1',
    call: { name: 'x402_pay', argsRaw: JSON.stringify({ url: 'https://paid.test' }) },
    callTime: 0,
    content: [{ type: 'text', text: 'paymentStatus: settled\nhttp: 200\ntransaction: 0xabc\n\n{"paymentStatus":"settled"}' }],
    isError: false,
    ...overrides,
  } as ToolCallBlock
}

describe('x402CallView', () => {
  it('reads url and cap from a running call', () => {
    const view = x402CallView(runningCall())
    expect(view.url).toBe('https://paid.test')
    expect(view.maxCostUsdc).toBe(0.5)
    expect(view.paymentStatus).toBeNull()
    expect(view.isError).toBe(false)
  })

  it('parses paymentStatus and transaction from a settled result', () => {
    const view = x402CallView(settledResult())
    expect(view.paymentStatus).toBe('settled')
    expect(view.transaction).toBe('0xabc')
    expect(view.isError).toBe(false)
  })

  it('flags an error result', () => {
    const view = x402CallView(settledResult({ isError: true }))
    expect(view.isError).toBe(true)
  })

  it('tolerates malformed arguments', () => {
    const view = x402CallView(runningCall({ argsRaw: 'not json' }))
    expect(view.url).toBeNull()
    expect(view.maxCostUsdc).toBeNull()
  })

  it('tolerates a result without a call head', () => {
    const view = x402CallView(settledResult({ call: null }))
    expect(view.url).toBeNull()
    expect(view.paymentStatus).toBe('settled')
  })

  it('treats a JSON primitive argument as no arguments', () => {
    const view = x402CallView(runningCall({ argsRaw: '42' }))
    expect(view.url).toBeNull()
    expect(view.maxCostUsdc).toBeNull()
  })

  it('leaves paymentStatus null when the result text carries none', () => {
    const view = x402CallView(settledResult({ content: [{ type: 'text', text: 'http: 200' }] }))
    expect(view.paymentStatus).toBeNull()
  })
})
