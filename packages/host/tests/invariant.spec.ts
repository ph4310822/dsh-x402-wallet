/**
 * Invariant companion tests: every broadcast x402/payment record satisfies
 * the event contract.
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import * as X402Invariant from '@deepseek-ai/dsh-x402/invariant'
import type { X402PaymentRecord } from '../src/types.ts'

async function setup(): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(InvariantRegistry)
  await ctx.plugin(X402Invariant)
  return ctx
}

function record(overrides: Partial<X402PaymentRecord> = {}): X402PaymentRecord {
  return {
    id: 'x402-1',
    url: 'https://api.example.test/data',
    amountUsdc: '0.001000',
    network: 'eip155:8453',
    transaction: '0xabc',
    status: 'settled',
    time: 0,
    ...overrides,
  }
}

describe('x402 invariant', () => {
  it('accepts a valid settled record', async () => {
    const ctx = await setup()
    expect(() => { ctx.emit('x402/payment', record()) }).not.toThrow()
  })

  it('accepts a failed record', async () => {
    const ctx = await setup()
    expect(() => { ctx.emit('x402/payment', record({ status: 'failed' })) }).not.toThrow()
  })

  it('rejects an empty URL', async () => {
    const ctx = await setup()
    expect(() => { ctx.emit('x402/payment', record({ url: '' })) }).toThrow(/url must be non-empty/)
  })

  it('rejects an empty amount', async () => {
    const ctx = await setup()
    expect(() => { ctx.emit('x402/payment', record({ amountUsdc: '' })) }).toThrow(/amountUsdc must be non-empty/)
  })

  it('rejects an unknown status', async () => {
    const ctx = await setup()
    expect(() => { ctx.emit('x402/payment', record({ status: 'pending' as never })) }).toThrow(/status must be settled or failed/)
  })
})
