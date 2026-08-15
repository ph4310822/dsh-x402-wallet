/**
 * Durable wallet registry: one row per wallet (public identity + credential
 * reference) in a storage domain; the private keys themselves live in the
 * credentials store. An in-memory store backs tests.
 * @module @danielng23/dsh-x402/wallet
 */

import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Address } from 'viem'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { Domain, KvTable } from '@deepseek-ai/dsh-storage-domain'
import type { X402WalletRecord } from './types.ts'

/** One durable wallet row: public identity plus the credential reference of its key. */
export interface X402Wallet {
  /** Opaque durable identity. */
  id: string
  /** User-chosen label. */
  label: string
  /** Checksummed wallet address. */
  address: Address
  /** Credential reference name holding the private key. */
  keyRef: string
  /** Epoch milliseconds when the wallet was created. */
  createdAt: number
}

const x402WalletSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  address: z.string().startsWith('0x'),
  keyRef: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
}) as unknown as z.ZodType<X402Wallet>

/** Durable wallet registry domain; the JSON backend persists it under the DSH home. */
export const x402WalletDomainSpec = defineDomain({
  name: 'x402_wallet',
  version: 0,
  tables: {
    wallets: domainTable<string, X402Wallet>(x402WalletSchema),
    meta: domainTable<string, { currentId: string }>(z.object({ currentId: z.string().min(1) })),
  },
})

/** The durable wallet-registry surface the service and tests share. */
export interface X402WalletStore {
  /** List every wallet in creation order. */
  list(): Promise<X402Wallet[]>
  /** Read one wallet by id. */
  get(id: string): Promise<X402Wallet | undefined>
  /** Read the selected wallet, when one exists. */
  current(): Promise<X402Wallet | undefined>
  /** Insert a new wallet. */
  create(wallet: X402Wallet): Promise<void>
  /** Make one wallet the selection. */
  setCurrent(id: string): Promise<void>
}

/** The current-selection meta row key. */
const CURRENT_KEY = 'current'

/** Storage-backed wallet store over one opened domain. */
export class StorageWalletStore implements X402WalletStore {
  private readonly wallets: KvTable<string, X402Wallet>
  private readonly meta: KvTable<string, { currentId: string }>

  /**
   * @param domain - opened x402 wallet domain (owned by the service).
   */
  constructor(domain: Domain<typeof x402WalletDomainSpec>) {
    this.wallets = domain.table('wallets')
    this.meta = domain.table('meta')
  }

  list(): Promise<X402Wallet[]> {
    return Promise.resolve([...this.wallets.entries()].map(([, wallet]) => wallet).sort((a, b) => a.createdAt - b.createdAt))
  }

  get(id: string): Promise<X402Wallet | undefined> {
    return Promise.resolve(this.wallets.get(id))
  }

  current(): Promise<X402Wallet | undefined> {
    const meta = this.meta.get(CURRENT_KEY)
    return Promise.resolve(meta === undefined ? undefined : this.wallets.get(meta.currentId))
  }

  async create(wallet: X402Wallet): Promise<void> {
    await this.wallets.put(wallet.id, wallet)
  }

  async setCurrent(id: string): Promise<void> {
    await this.meta.put(CURRENT_KEY, { currentId: id })
  }
}

/** Process-memory wallet store for tests and headless compositions without a storage backend. */
export class MemoryWalletStore implements X402WalletStore {
  private readonly rows = new Map<string, X402Wallet>()
  private currentId: string | undefined

  list(): Promise<X402Wallet[]> {
    return Promise.resolve([...this.rows.values()].sort((a, b) => a.createdAt - b.createdAt))
  }

  get(id: string): Promise<X402Wallet | undefined> {
    return Promise.resolve(this.rows.get(id))
  }

  current(): Promise<X402Wallet | undefined> {
    if (this.currentId === undefined) return Promise.resolve(undefined)
    return Promise.resolve(this.rows.get(this.currentId))
  }

  create(wallet: X402Wallet): Promise<void> {
    this.rows.set(wallet.id, wallet)
    return Promise.resolve()
  }

  setCurrent(id: string): Promise<void> {
    if (!this.rows.has(id)) return Promise.reject(new Error(`x402: cannot select unknown wallet ${id}`))
    this.currentId = id
    return Promise.resolve()
  }
}

/**
 * Mint a fresh durable wallet identity.
 * @returns a short random wallet id like `w-1a2b3c4d`.
 */
export function mintWalletId(): string {
  return `w-${randomUUID().slice(0, 8)}`
}

/**
 * Mint the credential reference name for one wallet.
 * @param walletId - the durable wallet id.
 * @returns the credential reference under which the wallet key is stored.
 */
export function keyRefOf(walletId: string): string {
  return `X402_WALLET_${walletId.replace(/[^A-Z0-9_]/gi, '').toUpperCase()}`
}

/**
 * Project one durable wallet row to its GUI record.
 * @param wallet - the durable wallet row.
 * @param isCurrent - whether this wallet is the selected one.
 * @returns the GUI-facing record.
 */
export function walletRecord(wallet: X402Wallet, isCurrent: boolean): X402WalletRecord {
  return { id: wallet.id, label: wallet.label, address: wallet.address, isCurrent }
}
