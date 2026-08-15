/** Pure projection of one `x402_pay` call from the frozen call/result node. */
import type { ToolCallBlock } from '@deepseek-ai/dsh-client-runtime/client';
/** One payment call's material, derived purely from the call/result slice. */
export interface X402CallView {
    url: string | null;
    maxCostUsdc: number | null;
    paymentStatus: 'settled' | 'settle_failed' | 'payment_required' | 'none' | null;
    transaction: string | null;
    isError: boolean;
}
/**
 * Derive the card's material from the frozen node — a pure function of the log slice.
 * @param block - frozen running call or settled result node.
 * @returns the payment call's material.
 */
export declare function x402CallView(block: ToolCallBlock): X402CallView;
//# sourceMappingURL=card-model.d.ts.map