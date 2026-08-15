//#region lib/types/invariant.js
/** Package-owned invariant companion. @module @deepseek-ai/dsh-x402/invariant */
const PACKAGE_NAME = "@deepseek-ai/dsh-x402";
/** Cordis companion plugin name. */
const name = "x402-invariant";
/** Service required before the companion can reserve and check package ownership. */
const inject = ["invariants"];
/** Validate one broadcast payment record against the event contract. */
function validateRecord(payment, fail) {
	if (payment.url.length === 0) fail("x402/payment url must be non-empty");
	if (payment.amountUsdc.length === 0) fail("x402/payment amountUsdc must be non-empty");
	if (payment.status !== "settled" && payment.status !== "failed") fail(`x402/payment status must be settled or failed, got ${JSON.stringify(payment.status)}`);
}
/** Every broadcast payment record satisfies the event contract. */
const install = (ctx, fail) => {
	ctx.on("x402/payment", (payment) => {
		validateRecord(payment, fail);
	});
};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
