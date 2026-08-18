import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Phantom-style wallet popup: balance hero, send/receive, activity, and the wallet switcher. */
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { IconCheckOutline16, IconChevronDownOutline14, IconCloseOutline16, IconCopyOutline16, IconPlusOutline16, IconRefreshOutline16, IconSendOutline16, Modal, writeClipboard, } from '@deepseek-ai/dsh-client-ui-primitives';
import { explorerTxUrl, faucetUrl } from "./explorer.js";
import css from './X402WalletModal.module.css';
/** Truncate an address to a displayable short form. */
export function shortAddress(address) {
    return address.length <= 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`;
}
/** Wrap children in a block-explorer link when the network is known. */
function TxLink({ network, hash, children }) {
    const url = explorerTxUrl(network, hash);
    if (url === undefined)
        return _jsx(_Fragment, { children: children });
    return (_jsx("a", { className: css.txLink, href: url, target: "_blank", rel: "noreferrer", title: hash, children: children }));
}
/** How long the transient copy label stays visible, in ms. */
const COPIED_MS = 1000;
/** Receive-screen balance polling interval, in ms. */
const RECEIVE_POLL_MS = 5000;
/** Render the balance hero and the send/receive actions. */
function MainView({ wallet, history, payments, t, onSend, onReceive, onCreate }) {
    if (wallet === null)
        return _jsx("div", { className: css.center, children: t('main.loading') });
    if (!wallet.configured) {
        return (_jsxs("div", { className: css.empty, children: [_jsx("div", { className: css.emptyTitle, children: t('main.empty') }), _jsx("div", { className: css.emptyHint, children: t('main.emptyHint') }), _jsx("button", { type: "button", className: css.primary, onClick: onCreate, children: t('main.create') })] }));
    }
    return (_jsxs("div", { className: css.main, children: [_jsxs("div", { className: css.hero, children: [_jsx("div", { className: css.heroLabel, children: t('main.balance') }), _jsx("div", { className: css.heroAmount, children: wallet.usdcBalance ?? '--' }), _jsx("div", { className: css.heroUnit, children: "USDC" })] }), _jsxs("div", { className: css.actions, children: [_jsxs("button", { type: "button", className: css.action, onClick: onSend, children: [_jsx(IconSendOutline16, {}), t('main.send')] }), _jsxs("button", { type: "button", className: css.action, onClick: onReceive, children: [_jsx(IconPlusOutline16, {}), t('main.receive')] })] }), _jsx("div", { className: css.sectionTitle, children: t('main.assets') }), _jsxs("div", { className: css.tokenRow, children: [_jsx("span", { className: css.tokenBadge, children: "$" }), _jsx("span", { className: css.tokenName, children: "USDC" }), _jsx("span", { className: css.tokenAmount, children: wallet.usdcBalance ?? '--' })] }), _jsx("div", { className: css.sectionTitle, children: t('main.activity') }), history.length === 0 && _jsx("div", { className: css.center, children: t('main.activityEmpty') }), _jsx("ul", { className: css.activity, children: history.map(entry => (_jsxs("li", { className: css.activityRow, children: [_jsxs("span", { className: entry.direction === 'out' ? css.amountOut : css.amountIn, children: [entry.direction === 'out' ? '−' : '+', entry.amountUsdc] }), _jsxs("span", { className: css.activityMeta, children: [entry.direction === 'out' ? t('main.send') : t('main.receive'), " \u00B7 ", shortAddress(entry.direction === 'out' ? entry.to : entry.from)] }), _jsx(TxLink, { network: wallet.network, hash: entry.hash, children: _jsxs("span", { className: css.activityBlock, children: ["#", entry.blockNumber] }) })] }, entry.hash))) }), _jsx("div", { className: css.sectionTitle, children: t('main.payments') }), payments.length === 0 && _jsx("div", { className: css.center, children: t('main.paymentsEmpty') }), _jsx("ul", { className: css.activity, children: payments.slice(0, 6).map(payment => (_jsxs("li", { className: css.activityRow, children: [_jsxs("span", { className: payment.status === 'settled' ? css.amountOut : css.amountIn, children: ["\u2212", payment.amountUsdc] }), _jsxs("span", { className: css.activityMeta, children: [payment.status === 'settled' ? t('history.settled') : t('history.failed'), " \u00B7 ", payment.url] }), _jsx("span", { className: css.activityBlock, children: payment.network })] }, payment.id))) })] }));
}
/** Render the receive view: full address, QR code, and copy. */
function ReceiveView({ wallet, t }) {
    const [copied, setCopied] = useState(false);
    const address = wallet?.configured === true ? (wallet.address ?? '') : '';
    const network = wallet?.network ?? '';
    const faucet = faucetUrl(network);
    const copy = () => {
        void writeClipboard(address).then((ok) => {
            if (!ok || copied)
                return;
            setCopied(true);
            window.setTimeout(() => { setCopied(false); }, COPIED_MS);
        });
    };
    return (_jsxs("div", { className: css.receive, children: [_jsx("div", { className: css.qrWrap, "aria-label": t('receive.qr'), children: _jsx(QRCode, { value: address || ' ', size: 148 }) }), _jsx("div", { className: css.addressLabel, children: t('receive.address') }), _jsx("code", { className: css.address, children: address }), _jsx("button", { type: "button", className: css.primary, "aria-label": t('receive.copy'), onClick: copy, children: copied
                    ? _jsxs("span", { className: css.copyOk, children: [_jsx(IconCheckOutline16, {}), t('receive.copied')] })
                    : _jsxs(_Fragment, { children: [_jsx(IconCopyOutline16, {}), t('receive.copy')] }) }), _jsx("div", { className: css.hint, children: t('receive.hint', { network }) }), faucet !== undefined && (_jsx("a", { className: css.faucet, href: faucet, target: "_blank", rel: "noreferrer", children: t('receive.faucet') }))] }));
}
/** Render the send view: recipient + amount, then the confirmed receipt. */
function SendView({ form, t, face, actions, network }) {
    const submit = (event) => {
        event.preventDefault();
        if (form.busy)
            return;
        if (!/^0x[0-9a-fA-F]{40}$/.test(form.to.trim()) || !(Number(form.amount) > 0)) {
            actions.patchSendForm({ error: t('send.invalid') });
            return;
        }
        actions.patchSendForm({ error: null });
        void face.send(form.to.trim(), form.amount.trim());
    };
    if (form.done !== null) {
        return (_jsxs("div", { className: css.receipt, children: [_jsx("span", { className: css.receiptIcon, children: _jsx(IconCheckOutline16, {}) }), _jsx("div", { className: css.receiptTitle, children: t('send.confirmed') }), _jsx("div", { className: css.receiptMeta, children: t('send.transaction') }), _jsx(TxLink, { network: network, hash: form.done.transaction, children: _jsx("code", { className: css.tx, children: form.done.transaction }) }), _jsxs("div", { className: css.receiptMeta, children: [form.done.amountUsdc, " USDC \u2192 ", shortAddress(form.done.to)] }), _jsx("button", { type: "button", className: css.primary, onClick: () => { actions.resetSendForm(); actions.setView({ kind: 'main' }); }, children: t('send.done') })] }));
    }
    return (_jsxs("form", { className: css.form, onSubmit: submit, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('send.to') }), _jsx("input", { className: css.input, value: form.to, placeholder: t('send.toPlaceholder'), onChange: (event) => { actions.patchSendForm({ to: event.target.value }); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('send.amount') }), _jsx("input", { className: css.input, type: "number", min: "0", step: "any", value: form.amount, placeholder: t('send.amountPlaceholder'), onChange: (event) => { actions.patchSendForm({ amount: event.target.value }); } })] }), form.error !== null && _jsx("div", { className: css.error, children: form.error }), _jsx("button", { type: "submit", className: css.primary, disabled: form.busy, children: form.busy ? t('send.busy') : t('send.submit') })] }));
}
/** Render the create/import view: label plus generate or imported key. */
function CreateView({ form, t, face, actions }) {
    const submit = (event) => {
        event.preventDefault();
        if (form.busy)
            return;
        const key = form.privateKey.trim();
        const mnemonic = form.mnemonic.trim();
        void face.createWallet(form.label.trim(), form.mode === 'key' && key !== '' ? key : undefined, form.mode === 'mnemonic' && mnemonic !== '' ? mnemonic : undefined);
    };
    return (_jsxs("form", { className: css.form, onSubmit: submit, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('create.label') }), _jsx("input", { className: css.input, value: form.label, placeholder: t('create.labelPlaceholder'), onChange: (event) => { actions.patchCreateForm({ label: event.target.value }); } })] }), _jsxs("div", { className: css.segmented, children: [_jsx("button", { type: "button", className: form.mode === 'generate' ? css.segmentActive : css.segment, onClick: () => { actions.patchCreateForm({ mode: 'generate' }); }, children: t('create.generate') }), _jsx("button", { type: "button", className: form.mode === 'key' ? css.segmentActive : css.segment, onClick: () => { actions.patchCreateForm({ mode: 'key' }); }, children: t('create.import') }), _jsx("button", { type: "button", className: form.mode === 'mnemonic' ? css.segmentActive : css.segment, onClick: () => { actions.patchCreateForm({ mode: 'mnemonic' }); }, children: t('create.mnemonic') })] }), form.mode === 'key' && (_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('create.privateKey') }), _jsx("textarea", { className: css.textarea, value: form.privateKey, placeholder: t('create.privateKeyPlaceholder'), onChange: (event) => { actions.patchCreateForm({ privateKey: event.target.value }); } })] })), form.mode === 'mnemonic' && (_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('create.mnemonic') }), _jsx("textarea", { className: css.textarea, value: form.mnemonic, placeholder: t('create.mnemonicPlaceholder'), onChange: (event) => { actions.patchCreateForm({ mnemonic: event.target.value }); } })] })), (form.mode === 'key' || form.mode === 'mnemonic') && _jsx("div", { className: css.hint, children: t('create.importHint') }), form.error !== null && _jsx("div", { className: css.error, children: form.error }), _jsx("button", { type: "submit", className: css.primary, disabled: form.busy, children: form.busy ? t('create.busy') : t('create.submit') })] }));
}
/** Render the wallet switcher list, one row per registered wallet. */
function WalletList({ wallets, t, onPick, onNew }) {
    return (_jsxs("div", { className: css.switcher, children: [_jsx("div", { className: css.switcherTitle, children: t('switch.title') }), _jsx("ul", { className: css.switcherList, children: wallets.map(wallet => (_jsx("li", { children: _jsxs("button", { type: "button", className: css.walletRow, onClick: () => { onPick(wallet.id); }, children: [_jsxs("span", { className: css.walletMeta, children: [_jsx("span", { className: css.walletLabel, children: wallet.label }), _jsx("span", { className: css.walletAddress, children: shortAddress(wallet.address) })] }), wallet.isCurrent && _jsx("span", { className: css.currentBadge, children: t('switch.current') })] }) }, wallet.id))) }), _jsxs("button", { type: "button", className: css.newWallet, onClick: onNew, children: [_jsx(IconPlusOutline16, {}), t('switch.new')] })] }));
}
/** Render the Phantom-style wallet popup with the four modal screens. */
export function X402WalletModal({ useStore, actions, face, t }) {
    const state = useStore(snapshot => snapshot);
    const [switcher, setSwitcher] = useState(false);
    const close = () => { actions.setOpen(false); };
    const goMain = () => { actions.setView({ kind: 'main' }); setSwitcher(false); };
    const view = state.view;
    // While the receive screen is open, poll so funds landing on-chain show up
    // without a manual refresh.
    useEffect(() => {
        if (!state.open || view.kind !== 'receive')
            return;
        const timer = window.setInterval(() => { void face.refresh(); }, RECEIVE_POLL_MS);
        return () => { window.clearInterval(timer); };
    }, [state.open, view.kind, face]);
    return (_jsx(Modal, { open: state.open, onClose: close, title: t('modal.title'), closeLabel: t('modal.close'), headless: true, className: css.dialog, children: _jsxs("div", { className: css.shell, children: [_jsxs("header", { className: css.header, children: [view.kind === 'main'
                            ? (_jsxs("button", { type: "button", className: css.walletButton, onClick: () => { setSwitcher(value => !value); }, "aria-expanded": switcher, children: [_jsx("span", { className: css.headerName, children: state.wallet?.configured === true
                                            ? (state.wallet.label ?? shortAddress(state.wallet.address ?? ''))
                                            : t('main.empty') }), _jsxs("span", { className: css.headerNetwork, children: [state.wallet?.network ?? '', _jsx(IconChevronDownOutline14, {})] })] }))
                            : _jsx("button", { type: "button", className: css.back, onClick: goMain, children: t('common.back') }), _jsxs("span", { className: css.headerTools, children: [_jsx("button", { type: "button", className: css.close, "aria-label": t('action.refresh'), onClick: () => { void face.refresh(); }, children: _jsx(IconRefreshOutline16, {}) }), _jsx("button", { type: "button", className: css.close, "aria-label": t('modal.close'), onClick: close, children: _jsx(IconCloseOutline16, {}) })] })] }), state.error !== null && _jsx("div", { className: css.error, children: t('modal.error', { message: state.error }) }), switcher && view.kind === 'main' && (_jsx(WalletList, { wallets: state.wallets, t: t, onPick: (id) => {
                        setSwitcher(false);
                        void face.selectWallet(id);
                    }, onNew: () => { setSwitcher(false); actions.setView({ kind: 'create' }); } })), view.kind === 'main' && (_jsx(MainView, { wallet: state.wallet, history: state.history, payments: state.payments, t: t, onSend: () => { actions.setView({ kind: 'send' }); }, onReceive: () => { actions.setView({ kind: 'receive' }); }, onCreate: () => { actions.setView({ kind: 'create' }); } })), view.kind === 'receive' && _jsx(ReceiveView, { wallet: state.wallet, t: t }), view.kind === 'send' && _jsx(SendView, { form: state.sendForm, t: t, face: face, actions: actions, network: state.wallet?.network ?? '' }), view.kind === 'create' && _jsx(CreateView, { form: state.createForm, t: t, face: face, actions: actions })] }) }));
}
//# sourceMappingURL=X402WalletModal.js.map