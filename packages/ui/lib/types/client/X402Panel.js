import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Sidebar wallet panel: status, balance, and recent payment history. */
import { useEffect, useState } from 'react';
import { IconCopyOutline16, IconRefreshOutline16, StateDot, Tooltip, writeClipboard, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './X402Panel.module.css';
/** How long the transient copy label stays visible, in ms. */
const COPIED_MS = 1000;
function shortAddress(address) {
    return address.length <= 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`;
}
/** Sidebar entry that opens the wallet panel. */
export function X402Panel({ useStore, refresh, t }) {
    const state = useStore(snapshot => snapshot);
    const [copied, setCopied] = useState(false);
    const address = state.wallet?.configured === true ? (state.wallet.address ?? '') : '';
    useEffect(() => {
        void refresh();
    }, [refresh]);
    const wallet = state.wallet;
    return (_jsxs("div", { className: css.panel, "aria-label": t('a11y.wallet'), children: [_jsxs("div", { className: css.header, children: [_jsx("span", { className: css.title, children: t('panel.title') }), _jsx(Tooltip, { label: t('action.refresh'), children: _jsx("button", { type: "button", className: css.refresh, "aria-label": t('action.refresh'), disabled: state.refreshing, onClick: () => { void refresh(); }, children: _jsx(IconRefreshOutline16, {}) }) })] }), state.error !== null && _jsx("div", { className: css.error, children: t('panel.error', { message: state.error }) }), wallet === null && state.error === null && _jsx("div", { className: css.loading, children: t('panel.loading') }), wallet !== null && !wallet.configured && (_jsxs("div", { className: css.unconfigured, children: [_jsxs("div", { className: css.statusRow, children: [_jsx(StateDot, { state: "warning" }), t('panel.unconfigured')] }), _jsx("div", { className: css.hint, children: t('panel.unconfiguredHint') })] })), wallet !== null && wallet.configured && (_jsxs("dl", { className: css.wallet, children: [_jsx("div", { className: css.field, children: _jsx("dt", { children: t('panel.network', { network: wallet.network }) }) }), wallet.address !== undefined && (_jsxs("div", { className: css.field, children: [_jsx("dt", { children: t('panel.address') }), _jsxs("dd", { children: [_jsx("span", { className: css.address, children: shortAddress(wallet.address) }), _jsx("button", { type: "button", className: css.copy, onClick: () => {
                                            void writeClipboard(address).then((ok) => {
                                                if (!ok || copied)
                                                    return;
                                                setCopied(true);
                                                window.setTimeout(() => { setCopied(false); }, COPIED_MS);
                                            });
                                        }, children: copied ? t('panel.copied') : _jsx(IconCopyOutline16, {}) })] })] })), wallet.usdcBalance !== undefined && (_jsxs("div", { className: css.field, children: [_jsx("dt", { children: t('panel.balance') }), _jsxs("dd", { children: [wallet.usdcBalance, " USDC"] })] }))] })), _jsx("div", { className: css.historyTitle, children: t('history.title') }), state.payments.length === 0 && _jsx("div", { className: css.empty, children: t('history.empty') }), _jsx("ul", { className: css.history, children: state.payments.slice(0, 6).map(payment => (_jsxs("li", { className: css.paymentRow, children: [_jsx("span", { className: payment.status === 'settled' ? css.settled : css.failed, children: payment.status === 'settled' ? t('history.settled') : t('history.failed') }), _jsx("span", { className: css.paymentAmount, children: t('row.paid', { amount: payment.amountUsdc }) }), _jsx("span", { className: css.paymentUrl, children: payment.url })] }, payment.id))) })] }));
}
//# sourceMappingURL=X402Panel.js.map