/** Wallet modal store: the one shared live fact for the sidebar surface. */
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';
const initialSendForm = () => ({ to: '', amount: '', busy: false, error: null, done: null });
const initialCreateForm = () => ({
    label: '', mode: 'generate', privateKey: '', mnemonic: '', busy: false, error: null,
});
/**
 * Create the wallet-modal store; call once per registration inside `apply`.
 * @returns the store handle the entry registration declares.
 */
export function createX402PanelStore() {
    return defineStore({
        init: () => ({
            wallet: null,
            wallets: [],
            history: [],
            payments: [],
            error: null,
            refreshing: false,
            open: false,
            view: { kind: 'main' },
            sendForm: initialSendForm(),
            createForm: initialCreateForm(),
        }),
        actions: {
            beginRefresh: (d) => {
                d.refreshing = true;
            },
            endRefresh: (d) => {
                d.refreshing = false;
            },
            applyWallet: (d, wallet) => {
                d.wallet = wallet;
            },
            applyWallets: (d, wallets) => {
                d.wallets = wallets;
            },
            applyHistory: (d, history) => {
                d.history = history;
            },
            applyPayments: (d, payments) => {
                d.payments = payments;
            },
            applyError: (d, error) => {
                d.error = error;
            },
            setOpen: (d, open) => {
                d.open = open;
            },
            setView: (d, view) => {
                d.view = view;
            },
            patchSendForm: (d, patch) => {
                d.sendForm = { ...d.sendForm, ...patch };
            },
            patchCreateForm: (d, patch) => {
                d.createForm = { ...d.createForm, ...patch };
            },
            resetSendForm: (d) => {
                d.sendForm = initialSendForm();
            },
            resetCreateForm: (d) => {
                d.createForm = initialCreateForm();
            },
        },
    });
}
//# sourceMappingURL=store.js.map