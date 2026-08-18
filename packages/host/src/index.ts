/**
 * x402 payment capability: native @x402 protocol client, wallet via
 * `ctx.credentials`, model-facing discover/estimate/pay/balance tools, and a
 * GUI-facing wallet remote.
 * @module @danielng23/dsh-x402
 */

import { Context, Service } from '@deepseek-ai/cordis'
import s from '@deepseek-ai/schemastery'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { type CallId } from '@deepseek-ai/dsh-llm'
import type { Network } from '@x402/core/types'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '@deepseek-ai/dsh-user-approval'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { isAddress } from 'viem'
import type { Hex } from 'viem'
import { createX402Protocol, X402Error } from './protocol.ts'
import type { X402Protocol } from './protocol.ts'
import { X402_SYSTEM_PROMPT } from './prompt.ts'
import { registerX402Tools } from './tools.ts'
import type { X402PayToolArgs } from './tools.ts'
import type {
  X402CatalogEntry, X402EstimateResult, X402HistoryEntry, X402PaymentReceipt, X402PaymentRecord,
  X402SendReceipt, X402WalletRecord, X402WalletState,
} from './types.ts'
import {
  keyRefOf, mintWalletId, StorageWalletStore, walletRecord, x402WalletDomainSpec,
} from './wallet.ts'
import type { X402Wallet, X402WalletStore } from './wallet.ts'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** x402 payment service: protocol calls, wallet state, and payment history. */
    x402: X402Service
  }
}

/** Process-local payment history depth; the session log remains the durable record. */
const MAX_RECORDS = 100

/** Deployment-varying x402 choices, changeable from cordis.yml. */
export interface X402Config {
  /** JSON-RPC endpoint of the payment network (USDC balance reads). */
  rpcUrl?: string
  /** CAIP-2 network the wallet pays on. */
  network?: string
  /** URL of the discoverable x402 API catalog. */
  catalogUrl?: string
  /** Default per-call spending cap in USDC when the model omits maxCostUsdc. */
  defaultMaxCostUsdc?: number
  /** Whether every paid call first asks the user for approval. */
  approvalRequired?: boolean
  /** Credential reference for the payment wallet private key. */
  keyRef?: string
  /** Total on-chain history window in blocks, scanned in provider-safe chunks (default 200000). */
  historyBlockRange?: number
}

/** Injectable construction inputs that keep the service socket-free in tests. */
export interface X402ServiceDeps {
  /** Fetch implementation; production uses the host global. */
  fetch: typeof fetch
  /** Durable wallet registry; production opens the storage domain in init. */
  walletStore?: X402WalletStore
}

/** The x402 payment capability: model tools, GUI remote, and wallet custody. */
export class X402Service extends TypertRemoteService {
  static inject = ['tools', 'credentials', 'approval', 'systemPrompt', 'storageDomain']

  static Config: s<X402Config> = s.object({
    rpcUrl: s.string().default('https://mainnet.base.org'),
    network: s.string().default('eip155:8453'),
    catalogUrl: s.string().default('https://x402mcp.app/catalog.json'),
    defaultMaxCostUsdc: s.number().min(0).default(1),
    approvalRequired: s.boolean().default(true),
    keyRef: s.string().default('X402_PRIVATE_KEY'),
    historyBlockRange: s.natural().min(1).max(1_000_000).default(200_000),
  })

  private readonly config: Required<X402Config>
  private readonly protocol: X402Protocol
  private readonly fetchImpl: typeof fetch
  private readonly records: X402PaymentRecord[] = []
  private nextRecord = 1
  private walletStore: X402WalletStore | undefined
  private paymentsTable: KvTable<string, X402PaymentRecord> | undefined

  /**
   * @param ctx - Host context carrying tools, credentials, approval, and system-prompt services.
   * @param config - Loader-validated deployment configuration.
   * @param deps - optional injected fetch for tests; defaults to the host global.
   */
  constructor(ctx: Context, config: X402Config, deps: X402ServiceDeps = { fetch: globalThis.fetch }) {
    super(ctx, 'x402')
    this.config = X402Service.Config(config) as Required<X402Config>
    this.fetchImpl = deps.fetch
    this.walletStore = deps.walletStore
    this.protocol = createX402Protocol({
      fetch: deps.fetch,
      rpcUrl: this.config.rpcUrl,
      network: this.config.network as Network,
      historyBlockRange: BigInt(this.config.historyBlockRange),
      resolveKey: () => this.resolveCurrentKey(),
    })
  }

  protected async [Service.init](): Promise<void> {
    registerX402Tools(this.ctx, this)
    this.ctx.systemPrompt.section({ name: 'tool:x402', order: 116, text: X402_SYSTEM_PROMPT })
    /* v8 ignore next 1 -- plugin mounts never carry an injected store; direct constructions never run init. */
    if (this.walletStore === undefined) {
      const domain = await this.ctx.storageDomain.open(x402WalletDomainSpec)
      this.ctx.effect(() => async () => {
        await domain.close()
      }, 'x402.walletDomainClose')
      this.walletStore = new StorageWalletStore(domain)
      this.paymentsTable = domain.table('payments')
      this.restorePayments(this.paymentsTable)
      await this.seedLegacyWallet()
    }
  }

  /** The durable wallet registry; unavailable only before init in direct constructions. */
  private requireWalletStore(): X402WalletStore {
    if (this.walletStore === undefined) {
      throw new X402Error('wallet-not-configured', 'x402 wallet store is not initialized')
    }
    return this.walletStore
  }

  /** The selected wallet, or a loud refusal when none exists. */
  private async requireCurrentWallet(): Promise<X402Wallet> {
    const store = this.requireWalletStore()
    const current = await store.current()
    if (current === undefined) {
      throw new X402Error('wallet-not-configured', 'No wallet yet — create one in the wallet panel first.')
    }
    return current
  }

  /** Resolve the current wallet's key per operation; a blank or missing value means unconfigured. */
  private async resolveCurrentKey(): Promise<string | undefined> {
    const store = this.walletStore
    if (store !== undefined) {
      const current = await store.current()
      if (current !== undefined) {
        return (await this.ctx.credentials.resolve(credentialRef(current.keyRef)))?.value
      }
    }
    const hit = await this.ctx.credentials.resolve(credentialRef(this.config.keyRef))
    return hit?.value
  }

  /** Seed a wallet from the legacy single-key credential so existing setups keep working. */
  private async seedLegacyWallet(): Promise<void> {
    const store = this.walletStore
    /* v8 ignore next 1 -- init assigns the store before seeding; the guard is defensive. */
    if (store === undefined) return
    if ((await store.list()).length > 0) return
    const hit = await this.ctx.credentials.resolve(credentialRef(this.config.keyRef))
    if (hit === undefined || hit.value.trim().length === 0) return
    const address = privateKeyToAccount(hit.value.trim() as Hex).address
    const wallet: X402Wallet = {
      id: mintWalletId(),
      label: 'Default wallet',
      address,
      keyRef: this.config.keyRef,
      createdAt: Date.now(),
    }
    await store.create(wallet)
    await store.setCurrent(wallet.id)
  }

  /**
   * List live x402 APIs from the catalog, optionally filtered.
   * @param keyword - substring filter against descriptions and URLs.
   * @param network - exact CAIP-2 network filter.
   * @returns at most the first 25 matching entries.
   */
  async discover(keyword?: string, network?: string): Promise<X402CatalogEntry[]> {
    const response = await this.fetchImpl(this.config.catalogUrl)
    if (!response.ok) {
      throw new Error(`x402 catalog unreachable: HTTP ${response.status}`)
    }
    const catalog = await response.json() as { services?: Array<{
      resource: string
      description?: string
      network?: string
      price_usdc?: string
      scheme?: string
      x402_version?: number
      live?: boolean
    }> }
    const needle = keyword?.toLowerCase()
    return (catalog.services ?? [])
      .filter(entry => entry.live !== false)
      .filter(entry => network === undefined || entry.network === network)
      .filter(entry => needle === undefined
        || entry.resource.toLowerCase().includes(needle)
        || (entry.description ?? '').toLowerCase().includes(needle))
      .slice(0, 25)
      .map(entry => ({
        resource: entry.resource,
        description: entry.description ?? '',
        network: entry.network ?? this.config.network,
        priceUsdc: entry.price_usdc ?? '',
        scheme: entry.scheme ?? 'exact',
        x402Version: entry.x402_version ?? 2,
        live: entry.live !== false,
      }))
  }

  /**
   * Probe one URL for its payment requirement without paying.
   * @param url - resource to probe.
   * @param method - HTTP method for the probe; defaults to GET.
   * @returns free or one concrete requirement.
   */
  async estimate(url: string, method?: string): Promise<X402EstimateResult> {
    const probe = await this.protocol.estimate(url, {
      method: method ?? 'GET',
      headers: { accept: 'application/json' },
    })
    if (probe.requirement === undefined) return { requiresPayment: false, status: probe.status }
    return { requiresPayment: true, requirement: probe.requirement }
  }

  /**
   * Read the wallet snapshot: configured status, address, and USDC balance.
   * @returns wallet state; balance RPC failures surface loud.
   */
  @Remote('wallet')
  async wallet(): Promise<X402WalletState> {
    const current = this.walletStore === undefined ? undefined : await this.walletStore.current()
    const key = await this.resolveCurrentKey()
    if (key === undefined || key.trim().length === 0) {
      return { configured: false, network: this.config.network }
    }
    const address = await this.protocol.address()
    const usdcBalance = await this.protocol.balance(address)
    return {
      configured: true,
      address,
      usdcBalance,
      network: this.config.network,
      ...(current === undefined ? {} : { label: current.label, walletId: current.id }),
    }
  }

  /**
   * List every wallet in the registry, marking the selected one.
   * @returns wallet records with the current selection flagged.
   */
  @Remote('wallets')
  async wallets(): Promise<X402WalletRecord[]> {
    const store = this.requireWalletStore()
    const current = await store.current()
    const all = await store.list()
    return all.map(wallet => walletRecord(wallet, current?.id === wallet.id))
  }

  /**
   * Create a wallet: generate a fresh key, or import a provided one. The key
   * is written to the credentials store; the registry keeps only public data.
   * @param request - label and an optional private key to import.
   * @returns the new wallet record; it becomes the selection when it is the first.
   */
  @Remote('createWallet')
  async createWallet(request: { label: string; privateKey?: string }): Promise<X402WalletRecord> {
    const store = this.requireWalletStore()
    const label = request.label.trim()
    if (label.length === 0) throw new X402Error('invalid-wallet', 'Wallet label must not be empty.')
    const id = mintWalletId()
    const keyRef = keyRefOf(id)
    const privateKey = request.privateKey?.trim()
    let key: string
    if (privateKey === undefined || privateKey.length === 0) {
      key = generatePrivateKey()
    } else {
      try {
        privateKeyToAccount(privateKey as Hex)
      } catch {
        throw new X402Error('invalid-wallet', 'The imported private key is invalid.')
      }
      key = privateKey
    }
    await this.ctx.credentials.set(credentialRef(keyRef), key)
    const address = privateKeyToAccount(key as Hex).address
    const wallet: X402Wallet = { id, label, address, keyRef, createdAt: Date.now() }
    await store.create(wallet)
    if ((await store.current()) === undefined) await store.setCurrent(id)
    return walletRecord(wallet, (await store.current())?.id === id)
  }

  /**
   * Make one wallet the selection used by payments and transfers.
   * @param id - durable wallet id from `wallets()`.
   * @returns confirmation once the selection is durably written.
   */
  @Remote('selectWallet')
  async selectWallet(id: string): Promise<{ ok: true }> {
    const store = this.requireWalletStore()
    if ((await store.get(id)) === undefined) throw new X402Error('wallet-not-found', `x402: unknown wallet ${id}`)
    await store.setCurrent(id)
    return { ok: true }
  }

  /**
   * Send USDC from the current wallet to an address and wait for confirmation.
   * @param request - recipient and human USDC amount.
   * @returns the confirmed transaction receipt.
   */
  @Remote('send')
  async send(request: { to: string; amountUsdc: string }): Promise<X402SendReceipt> {
    await this.requireCurrentWallet()
    const to = request.to.trim()
    if (!isAddress(to)) throw new X402Error('invalid-wallet', `Invalid recipient address "${request.to}".`)
    const { transaction } = await this.protocol.send(to, request.amountUsdc)
    return { transaction, to, amountUsdc: request.amountUsdc, status: 'confirmed' }
  }

  /**
   * Read recent on-chain USDC transfers touching the current wallet.
   * @param limit - maximum entries; defaults to 50.
   * @returns transfers newest first with direction and human amounts.
   */
  @Remote('history')
  async history(limit?: number): Promise<X402HistoryEntry[]> {
    const current = await this.requireCurrentWallet()
    return this.protocol.history(current.address, limit)
  }

  /**
   * Read the process-local payment history, newest first.
   * @returns the recorded settled and failed paid calls.
   */
  @Remote('payments')
  payments(): Promise<X402PaymentRecord[]> {
    return Promise.resolve([...this.records].reverse())
  }

  /**
   * Pay and call one x402 URL on behalf of an agent: probe, enforce the cap,
   * ask the user for approval, sign, retry, and record the outcome.
   * @param request - URL, call options, cap, and the asking agent.
   * @returns the parsed receipt of the paid call.
   */
  async payForAgent(request: X402PayToolArgs & { agent: Agent; callId?: CallId; signal?: AbortSignal }): Promise<X402PaymentReceipt> {
    const cap = request.maxCostUsdc ?? this.config.defaultMaxCostUsdc
    const init: RequestInit = {
      method: request.method ?? 'GET',
      ...(request.headers === undefined ? {} : { headers: request.headers }),
      ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
    }
    let paidAmount = '0.000000'
    const receipt = await this.protocol.pay(request.url, init, cap, async (requirement) => {
      paidAmount = requirement.amountUsdc
      if (!this.config.approvalRequired) return
      const outcome = await this.ctx.approval.request({
        agent: request.agent,
        toolName: 'x402_pay',
        ...(request.callId === undefined ? {} : { callId: request.callId }),
        reason: `x402 pay ${requirement.amountUsdc} USDC to ${requirement.payTo} for ${requirement.resource}`,
        ...(request.signal === undefined ? {} : { signal: request.signal }),
      })
      if (outcome === 'rejected' || outcome === 'cancelled') {
        throw new X402Error('rejected', 'The x402 payment was rejected; nothing was charged.')
      }
      if (outcome === 'unavailable') {
        throw new X402Error('rejected', 'No approval responder is available; the x402 payment was safely rejected.')
      }
    })
    if (receipt.paymentStatus === 'settled' || receipt.paymentStatus === 'settle_failed') {
      await this.record({
        url: request.url,
        amountUsdc: paidAmount,
        ...(receipt.transaction === undefined ? {} : { transaction: receipt.transaction }),
        status: receipt.paymentStatus === 'settled' ? 'settled' : 'failed',
      })
    }
    return receipt
  }

  /** Reload the durable payment ring from the domain; the ring stays capped at the newest records. */
  private restorePayments(table: KvTable<string, X402PaymentRecord>): void {
    const rows = [...table.entries()].map(([, record]) => record).sort((a, b) => a.time - b.time)
    this.records.push(...rows.slice(-MAX_RECORDS))
    const ids = rows.map(record => Number(record.id.replace(/^x402-/, ''))).filter(Number.isFinite)
    if (ids.length > 0) this.nextRecord = Math.max(...ids) + 1
  }

  /** Append one payment to the ring, persist it, and broadcast it to the GUI. */
  private async record(entry: Omit<X402PaymentRecord, 'id' | 'network' | 'time'>): Promise<void> {
    const record: X402PaymentRecord = {
      ...entry,
      id: `x402-${this.nextRecord++}`,
      network: this.config.network,
      time: Date.now(),
    }
    this.records.push(record)
    const evicted = this.records.length > MAX_RECORDS ? this.records.shift() : undefined
    const table = this.paymentsTable
    if (table !== undefined) {
      // Persistence is best-effort: a failed write must not fail the paid call.
      try {
        await table.put(record.id, record)
        /* v8 ignore next 2 -- eviction with a live table needs 101 real paid calls; the in-memory depth cap covers the shift logic. */
        if (evicted !== undefined) await table.delete(evicted.id)
      } catch {
        // Storage is down — the in-memory ring and the session log still hold the record.
      }
    }
    this.ctx.emit('x402/payment', record)
  }
}


export { createX402Protocol, X402Error, formatUsdc, parseUsdcAmount } from './protocol.ts'
export type { X402ErrorCode, X402EstimateProbe, X402Protocol, X402ProtocolDeps } from './protocol.ts'
export { X402_SYSTEM_PROMPT } from './prompt.ts'
export type * from './types.ts'

export default X402Service
