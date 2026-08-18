/** Wallet modal store: the one shared live fact for the sidebar surface. */
import type { EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client';
import type { X402HistoryEntry, X402PaymentRecord, X402SendReceipt, X402WalletRecord, X402WalletState } from '@deepseek-ai/dsh-x402/types';
/** One modal screen. */
export type X402WalletView = {
    kind: 'main';
} | {
    kind: 'receive';
} | {
    kind: 'send';
} | {
    kind: 'create';
};
/** Send-form working state. */
export interface X402SendForm {
    /** Recipient address being typed. */
    to: string;
    /** Human USDC amount being typed. */
    amount: string;
    /** Whether a transfer is in flight. */
    busy: boolean;
    /** Last send failure, when one occurred. */
    error: string | null;
    /** Confirmed receipt of the last send, when one succeeded. */
    done: X402SendReceipt | null;
}
/** Create-mode: generate a fresh key, import a private key, or import a mnemonic. */
export type X402CreateMode = 'generate' | 'key' | 'mnemonic';
/** Create/import-form working state. */
export interface X402CreateForm {
    /** Wallet label being typed. */
    label: string;
    /** Active creation mode. */
    mode: X402CreateMode;
    /** Imported private key, when the user chose to import one. */
    privateKey: string;
    /** Imported mnemonic phrase, when the user chose to import one. */
    mnemonic: string;
    /** Whether a create is in flight. */
    busy: boolean;
    /** Last create failure, when one occurred. */
    error: string | null;
}
/** Whole wallet-modal reading, refreshed as one batch from the Host remote. */
export interface X402PanelState {
    /** Latest current-wallet snapshot; null before the first successful read. */
    wallet: X402WalletState | null;
    /** Every wallet in the registry, newest-created first. */
    wallets: X402WalletRecord[];
    /** On-chain transfer history of the current wallet, newest first. */
    history: X402HistoryEntry[];
    /** Model-initiated payments, newest first. */
    payments: X402PaymentRecord[];
    /** Model-facing error from the last refresh, when one occurred. */
    error: string | null;
    /** Whether a refresh is in flight. */
    refreshing: boolean;
    /** Whether the wallet modal is open. */
    open: boolean;
    /** Active modal screen. */
    view: X402WalletView;
    /** Send-form working state. */
    sendForm: X402SendForm;
    /** Create/import-form working state. */
    createForm: X402CreateForm;
}
/**
 * Complete mutation API of the wallet modal store (a type alias: the draft
 * parameter is baked away before components or inject factories see it).
 */
export type X402PanelActions = {
    beginRefresh: (draft: X402PanelState) => void;
    endRefresh: (draft: X402PanelState) => void;
    applyWallet: (draft: X402PanelState, wallet: X402WalletState | null) => void;
    applyWallets: (draft: X402PanelState, wallets: X402WalletRecord[]) => void;
    applyHistory: (draft: X402PanelState, history: X402HistoryEntry[]) => void;
    applyPayments: (draft: X402PanelState, payments: X402PaymentRecord[]) => void;
    applyError: (draft: X402PanelState, error: string | null) => void;
    setOpen: (draft: X402PanelState, open: boolean) => void;
    setView: (draft: X402PanelState, view: X402WalletView) => void;
    patchSendForm: (draft: X402PanelState, patch: Partial<X402SendForm>) => void;
    patchCreateForm: (draft: X402PanelState, patch: Partial<X402CreateForm>) => void;
    resetSendForm: (draft: X402PanelState) => void;
    resetCreateForm: (draft: X402PanelState) => void;
};
/** Store handle the modal reads through `useStore`. */
export type X402PanelStore = EngineStoreHandle<X402PanelState, X402PanelActions>;
/**
 * Create the wallet-modal store; call once per registration inside `apply`.
 * @returns the store handle the entry registration declares.
 */
export declare function createX402PanelStore(): X402PanelStore;
//# sourceMappingURL=store.d.ts.map