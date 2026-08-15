/** Injected faces of the x402 wallet surfaces. */

/** Sidebar entry face: opening the wallet modal. */
export interface X402EntryFace {
  /** Open the wallet modal. */
  open: () => void
}

/** Wallet modal face: live reads and the user-initiated wallet verbs. */
export interface X402ModalFace {
  /** Refresh the wallet snapshot, registry, history, and payments from the Host. */
  refresh: () => Promise<void>
  /** Create (generate) or import a wallet and switch to it. */
  createWallet: (label: string, privateKey?: string) => Promise<void>
  /** Make one wallet the selection. */
  selectWallet: (id: string) => Promise<void>
  /** Send USDC from the current wallet and wait for confirmation. */
  send: (to: string, amountUsdc: string) => Promise<void>
}
