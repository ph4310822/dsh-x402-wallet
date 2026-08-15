/** Phantom-style wallet popup: balance hero, send/receive, activity, and the wallet switcher. */
import type { X402ModalFace } from './slots.ts';
import type { X402WalletEntryProps } from './X402WalletEntry.tsx';
/** Modal props: the store share, the modal face, and the locale seat. */
export type X402WalletModalProps = {
    useStore: X402WalletEntryProps['useStore'];
    actions: X402WalletEntryProps['actions'];
    face: X402ModalFace;
    t: X402WalletEntryProps['t'];
};
/** Truncate an address to a displayable short form. */
export declare function shortAddress(address: string): string;
/** Render the Phantom-style wallet popup with the four modal screens. */
export declare function X402WalletModal({ useStore, actions, face, t }: X402WalletModalProps): import("react").JSX.Element;
//# sourceMappingURL=X402WalletModal.d.ts.map