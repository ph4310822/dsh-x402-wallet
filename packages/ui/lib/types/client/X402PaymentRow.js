import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Conversation payment card for `x402_pay` calls: a pure projection of the logged call/result slice. */
import { useState } from 'react';
import { DisclosureRow, IconCheckOutline16, IconCloseOutline16, StateDot } from '@deepseek-ai/dsh-client-ui-primitives';
import { x402CallView } from "./card-model.js";
import css from './X402PaymentRow.module.css';
const STATUS_LABELS = {
    settled: 'history.settled',
    settle_failed: 'history.failed',
    payment_required: 'row.paymentRequired',
    none: 'row.free',
};
function leadingFor(view) {
    if (view.isError)
        return _jsx(StateDot, { state: "error" });
    if (view.paymentStatus === 'settled')
        return _jsx(IconCheckOutline16, {});
    if (view.paymentStatus === 'settle_failed' || view.paymentStatus === 'payment_required')
        return _jsx(IconCloseOutline16, {});
    return undefined;
}
/** Render one `x402_pay` call as a payment card. */
export function X402PaymentRow({ block, t }) {
    const [open, setOpen] = useState(false);
    const view = x402CallView(block);
    const statusLabel = view.paymentStatus === null ? null : STATUS_LABELS[view.paymentStatus];
    return (_jsx(DisclosureRow, { rowClassName: css.row, icon: leadingFor(view), title: `${view.url ?? block.callId} · ${statusLabel !== null ? t(statusLabel) : t('row.awaiting')}`, open: open, expandable: true, expandOnRowClick: true, onToggle: () => { setOpen(value => !value); }, children: _jsxs("dl", { className: css.details, children: [view.maxCostUsdc !== null && (_jsxs("div", { className: css.field, children: [_jsx("dt", { children: "cap" }), _jsxs("dd", { children: [view.maxCostUsdc, " USDC"] })] })), view.transaction !== null && (_jsxs("div", { className: css.field, children: [_jsx("dt", { children: "tx" }), _jsx("dd", { className: css.tx, children: view.transaction })] }))] }) }));
}
//# sourceMappingURL=X402PaymentRow.js.map