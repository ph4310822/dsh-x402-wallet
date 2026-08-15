//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-x402`.
* @module @deepseek-ai/dsh-client-ui-x402/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-x402";
/** Cordis companion plugin name. */
const name = "client-ui-x402-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the node half emits no cordis events and holds no
* cross-plugin state; the wallet panel store lives in the browser process,
* out of reach of the host invariant service, and the payment card is a pure
* projection of logged tool call/result slices.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
