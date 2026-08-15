/** Package-owned invariant companion. @module @danielng23/dsh-x402/invariant */

import type { Context } from '@deepseek-ai/cordis'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@danielng23/dsh-x402'

/** Cordis companion plugin name. */
export const name = 'x402-invariant'
/** Service required before the companion can reserve and check package ownership. */
export const inject = ['invariants']

/** Validate one broadcast payment record against the event contract. */
function validateRecord(payment: { url: string; amountUsdc: string; status: string }, fail: InvariantFailure): void {
  if (payment.url.length === 0) fail('x402/payment url must be non-empty')
  if (payment.amountUsdc.length === 0) fail('x402/payment amountUsdc must be non-empty')
  if (payment.status !== 'settled' && payment.status !== 'failed') {
    fail(`x402/payment status must be settled or failed, got ${JSON.stringify(payment.status)}`)
  }
}

/** Every broadcast payment record satisfies the event contract. */
const install: InvariantInstaller = (ctx: Context, fail: InvariantFailure) => {
  ctx.on('x402/payment', (payment) => {
    validateRecord(payment, fail)
  })
}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
