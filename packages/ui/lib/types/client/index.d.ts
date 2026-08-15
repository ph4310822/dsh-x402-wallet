/** x402 wallet surfaces, browser half: a sidebar entry opening a Phantom-style wallet popup, and the pay card. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export type { X402EntryFace, X402ModalFace } from './slots.ts';
export type { X402WalletEntryProps } from './X402WalletEntry.tsx';
export type { X402WalletModalProps } from './X402WalletModal.tsx';
export type { X402PaymentRowProps } from './X402PaymentRow.tsx';
export type { X402CallView } from './card-model.ts';
export type { X402PanelState, X402PanelActions, X402PanelStore } from './store.ts';
export type { X402Key } from './locales.ts';
/** Required services: slot composition, locale dictionaries, the Host Remote carrier, and the x402 namespace. */
export declare const inject: string[];
/** Mount the wallet entry/popup and the x402_pay card. */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map