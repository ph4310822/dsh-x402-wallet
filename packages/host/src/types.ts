/**
 * Client-safe wire vocabulary of the x402 payment capability.
 * @module @danielng23/dsh-x402/types
 */

import type { JsonValue } from '@deepseek-ai/dsh-session/types'

/** One x402-enabled API entry from the discovered catalog. */
export interface X402CatalogEntry {
  /** Exact resource URL an x402_pay call targets. */
  resource: string
  /** What the API offers, as the catalog published it. */
  description: string
  /** CAIP-2 network identifier the payment settles on (e.g. `eip155:8453`). */
  network: string
  /** Human-readable price, e.g. `0.001000 USDC`. */
  priceUsdc: string
  /** Payment scheme the API accepts. */
  scheme: string
  /** x402 protocol version the API speaks. */
  x402Version: number
  /** Whether the catalog's latest probe found the API live. */
  live: boolean
}

/** Normalized payment requirement surfaced to the model and the approval UI. */
export interface X402PaymentRequirement {
  /** Payment scheme the API accepts. */
  scheme: string
  /** CAIP-2 network identifier the payment settles on. */
  network: string
  /** Raw amount in the asset's smallest unit, as the server declared it. */
  amountRaw: string
  /** Human amount in USDC decimal units, e.g. `0.001000`. */
  amountUsdc: string
  /** Resource being paid for. */
  resource: string
  /** What the resource provides. */
  description: string
  /** Address that receives the payment. */
  payTo: string
  /** Seconds the payment authorization stays valid. */
  maxTimeoutSeconds: number
}

/** Result of one x402_estimate call: either free or one concrete requirement. */
export type X402EstimateResult =
  | { requiresPayment: false; status: number }
  | { requiresPayment: true; requirement: X402PaymentRequirement }

/** Outcome of one paid x402 call, parsed from the settlement response. */
export interface X402PaymentReceipt {
  /** URL that was paid and called. */
  url: string
  /** Final HTTP status of the paid request. */
  status: number
  /** Protocol verdict: settled, settle failed, still payment-required, or no payment involved. */
  paymentStatus: 'settled' | 'settle_failed' | 'payment_required' | 'none'
  /** API response body. */
  body: JsonValue
  /** On-chain transaction hash, when the server reported one. */
  transaction?: string
  /** Payer address, when the server reported one. */
  payer?: string
}

/** Wallet snapshot served to the GUI popup. */
export interface X402WalletState {
  /** Whether the configured credential reference resolves to a key. */
  configured: boolean
  /** Wallet address derived from the key, when configured. */
  address?: string
  /** Human USDC balance on the payment network, when readable. */
  usdcBalance?: string
  /** CAIP-2 network the wallet pays on. */
  network: string
  /** Current wallet label, when one exists. */
  label?: string
  /** Current wallet id, when one exists. */
  walletId?: string
}

/** One wallet in the durable registry, as the GUI lists it. */
export interface X402WalletRecord {
  /** Opaque durable identity. */
  id: string
  /** User-chosen label. */
  label: string
  /** Checksummed wallet address. */
  address: string
  /** Whether this wallet is the selected one. */
  isCurrent: boolean
}

/** Receipt of one GUI-initiated USDC transfer. */
export interface X402SendReceipt {
  /** On-chain transaction hash. */
  transaction: string
  /** Recipient address. */
  to: string
  /** Human USDC amount sent. */
  amountUsdc: string
  /** On-chain confirmation state. */
  status: 'confirmed'
}

/** One on-chain USDC transfer touching the current wallet. */
export interface X402HistoryEntry {
  /** On-chain transaction hash. */
  hash: string
  /** Sender address. */
  from: string
  /** Recipient address. */
  to: string
  /** Human USDC amount moved. */
  amountUsdc: string
  /** Block the transfer landed in. */
  blockNumber: number
  /** Whether the wallet sent or received this transfer. */
  direction: 'out' | 'in'
}

/** One settled or failed paid call, kept in a process-local ring. */
export interface X402PaymentRecord {
  /** Opaque process-local identity. */
  id: string
  /** URL that was paid and called. */
  url: string
  /** Human USDC amount paid. */
  amountUsdc: string
  /** CAIP-2 network the payment settled on. */
  network: string
  /** On-chain transaction hash, when known. */
  transaction?: string
  /** Whether the paid call settled. */
  status: 'settled' | 'failed'
  /** Epoch milliseconds when the call settled. */
  time: number
}

declare module '@deepseek-ai/cordis' {
  interface Events {
    /**
     * One paid x402 call settled or failed; the GUI popup replays from this.
     * @param payment - URL, amount, network, transaction, and outcome.
     * @mode emit
     */
    'x402/payment'(payment: X402PaymentRecord): void
  }
}
