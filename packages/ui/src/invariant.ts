/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-x402`.
 * @module @deepseek-ai/dsh-client-ui-x402/invariant
 */

import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-x402'

/** Cordis companion plugin name. */
export const name = 'client-ui-x402-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the node half emits no cordis events and holds no
 * cross-plugin state; the wallet panel store lives in the browser process,
 * out of reach of the host invariant service, and the payment card is a pure
 * projection of logged tool call/result slices.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
