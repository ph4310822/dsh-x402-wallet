/** Sidebar entry that opens the Phantom-style x402 wallet popup. */
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { X402EntryFace, X402ModalFace } from './slots.ts';
import { createX402PanelStore } from './store.ts';
/** Full entry props composed by the sidebar footer-action slot. */
export type X402WalletEntryProps = PropsRuntime<'sidebar.footer.action'> & PropsStore<ReturnType<typeof createX402PanelStore>> & InjectFace<X402EntryFace & X402ModalFace> & PropsLocale<'x402'>;
/**
 * Sidebar entry button plus the wallet popup it opens. The modal is rendered
 * directly here: the primitives Modal portals to the document body, so no
 * separate slot surface is needed. `open` and `refresh` come from the inject
 * face (open is a verb, distinct from the store's `open` boolean, which lives
 * inside the snapshot).
 */
export declare function X402WalletEntry({ useStore, actions, open, refresh, createWallet, selectWallet, send, t }: X402WalletEntryProps): import("react").JSX.Element;
//# sourceMappingURL=X402WalletEntry.d.ts.map