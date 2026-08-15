import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Sidebar entry that opens the Phantom-style x402 wallet popup. */
import { useEffect } from 'react';
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import { X402WalletModal } from "./X402WalletModal.js";
import css from './X402WalletEntry.module.css';
/**
 * Sidebar entry button plus the wallet popup it opens. The modal is rendered
 * directly here: the primitives Modal portals to the document body, so no
 * separate slot surface is needed. `open` and `refresh` come from the inject
 * face (open is a verb, distinct from the store's `open` boolean, which lives
 * inside the snapshot).
 */
export function X402WalletEntry({ useStore, actions, open, refresh, createWallet, selectWallet, send, t }) {
    const state = useStore(snapshot => snapshot);
    useEffect(() => {
        void refresh();
    }, [refresh]);
    const hasWallet = state.wallet?.configured === true;
    return (_jsxs(_Fragment, { children: [_jsx(Tooltip, { label: hasWallet ? t('panel.title') : t('entry.unconfigured'), children: _jsxs("button", { type: "button", className: css.entry, "aria-label": t('a11y.wallet'), "data-unconfigured": hasWallet ? undefined : true, onClick: () => { open(); }, children: [_jsx("span", { className: css.entryMark, children: "$" }), _jsx("span", { className: css.entryLabel, children: t('panel.title') })] }) }), _jsx(X402WalletModal, { useStore: useStore, actions: actions, face: { refresh, createWallet, selectWallet, send }, t: t })] }));
}
//# sourceMappingURL=X402WalletEntry.js.map