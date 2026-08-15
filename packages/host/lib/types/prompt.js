/**
 * System-prompt section teaching the x402 payment tools.
 * @module @deepseek-ai/dsh-x402/prompt
 */
/** The model-facing operating rules for the x402 tools. */
export const X402_SYSTEM_PROMPT = `
x402 payment tools let you call paid APIs that answer HTTP 402 with a crypto payment requirement.

Workflow:
1. x402_discover — find a live paid API for the task. Filter by keyword or network.
2. x402_estimate — probe the chosen URL to learn the exact cost without paying.
3. x402_balance — confirm the wallet is configured and funded before any payment.
4. x402_pay — pay and call the URL in one step. Always pass maxCostUsdc; the call aborts before paying when the cost exceeds it.

Rules:
- A 200 response needs no payment; x402_pay returns it directly.
- Never raise maxCostUsdc above the configured default without the user explicitly agreeing.
- Prefer the cheapest live API that fits the task.
- Every payment asks the user for approval first; do not claim a payment settled until the tool reports paymentStatus "settled".
- The wallet holds only a small spending float; a failed balance read means the RPC is unreachable, not that funds are gone.
`.trim();
//# sourceMappingURL=prompt.js.map