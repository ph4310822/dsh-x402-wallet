/** Conversation payment card for `x402_pay` calls: a pure projection of the logged call/result slice. */
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client';
/** Full card props composed by the keyed Tool slot. */
export type X402PaymentRowProps = ToolCallViewProps & PropsLocale<'x402'>;
/** Render one `x402_pay` call as a payment card. */
export declare function X402PaymentRow({ block, t }: X402PaymentRowProps): import("react").JSX.Element;
//# sourceMappingURL=X402PaymentRow.d.ts.map