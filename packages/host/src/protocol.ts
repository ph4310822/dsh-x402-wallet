/**
 * Native x402 protocol client: probe a 402 challenge, enforce a spending cap,
 * sign a payment authorization with the wallet key, retry with the proof, and
 * parse the settlement. All network access goes through an injected fetch so
 * unit tests run without sockets.
 * @module @danielng23/dsh-x402/protocol
 */

import { x402Client, x402HTTPClient } from '@x402/core/client'
import type { Network, PaymentRequired } from '@x402/core/types'
import { ExactEvmScheme, getDefaultAsset } from '@x402/evm'
import { createPublicClient, createWalletClient, custom, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import type { Address, Hex, LocalAccount } from 'viem'
import type { JsonValue } from '@deepseek-ai/dsh-session/types'
import type { X402HistoryEntry, X402PaymentReceipt, X402PaymentRequirement } from './types.ts'

/** Machine-readable x402 failure codes the tools and GUI can branch on. */
export type X402ErrorCode =
  | 'wallet-not-configured'
  | 'network-unsupported'
  | 'asset-unsupported'
  | 'cap-exceeded'
  | 'version-unsupported'
  | 'rejected'
  | 'invalid-amount'
  | 'insufficient-balance'
  | 'transfer-failed'
  | 'invalid-wallet'
  | 'wallet-not-found'

/** One protocol failure with a stable code and a model-facing message. */
export class X402Error extends Error {
  override readonly name = 'X402Error'
  constructor(readonly code: X402ErrorCode, message: string) {
    super(message)
  }
}

/** Result of one payment probe: either free or one concrete requirement. */
export interface X402EstimateProbe {
  /** HTTP status of the first request. */
  status: number
  /** The parsed requirement when the server answered 402. */
  requirement?: X402PaymentRequirement
}

/** The protocol surface the service and tests share. */
export interface X402Protocol {
  /**
   * Probe one URL for its payment requirement without paying.
   * @param url - resource to probe.
   * @param init - optional request options (headers, method, body).
   * @returns the HTTP status and the parsed requirement, when the server asked for payment.
   */
  estimate(url: string, init?: RequestInit): Promise<X402EstimateProbe>
  /**
   * Pay and call one x402 URL in one step.
   * @param url - resource to pay for and call.
   * @param init - request options for both the probe and the paid call.
   * @param capUsdc - hard spending cap in USDC units; the call aborts before signing when exceeded.
   * @param confirm - optional hook invoked with the concrete requirement between probe and signing (approval).
   * @returns the parsed receipt of the paid call.
   */
  pay(
    url: string,
    init: RequestInit,
    capUsdc: number,
    confirm?: (requirement: X402PaymentRequirement) => Promise<void>,
  ): Promise<X402PaymentReceipt>
  /** Derive the wallet address from the resolved key. */
  address(): Promise<Address>
  /** Read the human USDC balance of the wallet on the payment network. */
  balance(address: Address): Promise<string>
  /**
   * Broadcast a USDC transfer from the current wallet and wait for confirmation.
   * @param to - recipient address.
   * @param amountUsdc - human USDC amount, e.g. `1.25`.
   * @returns the confirmed transaction hash.
   */
  send(to: Address, amountUsdc: string): Promise<{ transaction: Hex }>
  /**
   * Read recent on-chain USDC transfers touching one address, newest first.
   * @param address - wallet address to inspect.
   * @param limit - maximum entries; defaults to 50.
   * @returns transfers where the address sent or received.
   */
  history(address: Address, limit?: number): Promise<X402HistoryEntry[]>
}

/** Injectable inputs that keep the protocol socket-free in tests. */
export interface X402ProtocolDeps {
  /** Fetch implementation; production uses the host global. */
  fetch: typeof fetch
  /** JSON-RPC endpoint for the payment network (balance reads). */
  rpcUrl: string
  /** CAIP-2 network the wallet pays on. */
  network: Network
  /** On-chain history window in blocks; public RPCs cap `eth_getLogs` ranges. */
  historyBlockRange?: bigint
  /** Resolve the wallet private key from the credential store, per operation. */
  resolveKey: () => Promise<string | undefined>
}

const BALANCE_OF_ABI = [{
  inputs: [{ name: 'owner', type: 'address' }],
  name: 'balanceOf',
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function',
}] as const

/** Minimal ERC-20 transfer ABI (USDC on the payment network). */
const ERC20_ABI = [{
  name: 'transfer',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
  ],
  outputs: [{ name: '', type: 'bool' }],
}] as const

/** ERC-20 Transfer event for on-chain history reads. */
const TRANSFER_EVENT = {
  name: 'Transfer',
  type: 'event',
  inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256' },
  ],
} as const

/** Default on-chain history window in blocks; public RPCs reject `eth_getLogs` ranges at or above 10,000. */
export const DEFAULT_HISTORY_BLOCK_RANGE = 9_000n

/** Per-RPC-call timeout: a hung public node must not stall the GUI refresh. */
const RPC_TIMEOUT_MS = 20_000

/**
 * Parse a human USDC amount into the token's smallest unit.
 * @param amountUsdc - decimal string, e.g. `1.25`.
 * @param decimals - token decimals (6 for USDC).
 * @returns the raw amount; throws `invalid-amount` on malformed input.
 */
export function parseUsdcAmount(amountUsdc: string, decimals: number): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amountUsdc.trim())
  if (match === null) throw new X402Error('invalid-amount', `invalid USDC amount "${amountUsdc}" — use a plain decimal like 1.25`)
  /* v8 ignore next 1 -- the regex guarantees a whole part; the fallback is defensive. */
  const whole = BigInt(match[1] ?? '0')
  const fraction = (match[2] ?? '').padEnd(decimals, '0').slice(0, decimals)
  /* v8 ignore next 1 -- padding makes fraction non-empty for decimals >= 1; the 0n arm is defensive. */
  const fractionValue = fraction.length === 0 ? 0n : BigInt(fraction)
  return whole * 10n ** BigInt(decimals) + fractionValue
}

/**
 * Build a JSON-RPC custom transport over the injected fetch.
 * @param fetchImpl - fetch implementation.
 * @param rpcUrl - JSON-RPC endpoint.
 * @returns a viem transport usable by public and wallet clients.
 */
function createRpcTransport(fetchImpl: typeof fetch, rpcUrl: string) {
  return custom({
    request: async ({ method, params }: { method: string; params?: unknown[] }) => {
      /* v8 ignore next 3 -- viem always supplies params for readContract calls; the fallback is defensive. */
      const rpcBody = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: (params ?? []) })
      try {
        const response = await fetchImpl(rpcUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: rpcBody,
          signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
        })
        const json = await response.json() as { result?: unknown; error?: { message?: string } }
        if (json.error !== undefined) {
          throw new Error(`x402 RPC ${method} failed: ${json.error.message ?? 'unknown error'}`)
        }
        return json.result
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          throw new Error(`x402 RPC ${method} timed out after ${RPC_TIMEOUT_MS}ms`)
        }
        throw error
      }
    },
  })
}

/**
 * Format a raw token amount as a fixed-decimal USDC string.
 * @param raw - amount in the token's smallest unit.
 * @param decimals - token decimals (6 for USDC).
 * @returns a six-fraction-digit USDC string.
 */
export function formatUsdc(raw: string, decimals: number): string {
  const value = BigInt(raw)
  const scale = 10n ** BigInt(decimals)
  const whole = value / scale
  const fraction = value % scale
  return `${whole}.${fraction.toString().padStart(decimals, '0').slice(0, 6)}`
}

/** One-line error text for protocol failure messages. */
function errorMessage(error: unknown): string {
  /* v8 ignore next 1 -- viem and the SDK always throw Errors; String() is defensive. */
  return error instanceof Error ? error.message : String(error)
}

/** Parse a 402 response body without consuming a body the caller may still need. */
async function tryJson(response: Response): Promise<unknown> {
  try {
    return await response.clone().json()
  } catch {
    return undefined
  }
}

/**
 * Create the payment protocol bound to one network and one credential source.
 * @param deps - network, RPC endpoint, and the per-operation key resolver.
 * @returns the protocol surface the service and tests share.
 */
export function createX402Protocol(deps: X402ProtocolDeps): X402Protocol {
  // getDefaultAsset fails loud for an unknown network at construction time.
  const asset = getDefaultAsset(deps.network)
  const decimals = asset.decimals
  const client = new x402Client()
  const http = new x402HTTPClient(client)
  let account: LocalAccount | undefined
  let publicClient: ReturnType<typeof makePublic> | undefined

  /** Build the public client over the injected RPC transport. */
  function makePublic() {
    return createPublicClient({ chain: base, transport: createRpcTransport(deps.fetch, deps.rpcUrl) })
  }

  /** The cached public client. */
  function thisPublic(): ReturnType<typeof makePublic> {
    publicClient ??= makePublic()
    return publicClient
  }

  /** Resolve the signing account from the current wallet key, re-registering the scheme on switch. */
  async function requireAccount(): Promise<LocalAccount> {
    const key = await deps.resolveKey()
    if (key === undefined || key.trim().length === 0) {
      throw new X402Error(
        'wallet-not-configured',
        'x402 wallet is not configured. Set the X402_PRIVATE_KEY credential (a dedicated spending wallet, not your main wallet) '
          + 'through the credentials store or environment, then retry.',
      )
    }
    const next = privateKeyToAccount(key.trim() as Hex)
    if (account === undefined || account.address !== next.address) {
      account = next
      client.register(deps.network, new ExactEvmScheme(account))
    }
    return account
  }

  /** Pick the one accepted requirement this wallet can pay, or fail loud. */
  function selectRequirement(required: PaymentRequired): X402PaymentRequirement {
    if (required.x402Version !== 2) {
      throw new X402Error(
        'version-unsupported',
        `this server speaks x402 v${required.x402Version}; the plugin pays x402 v2. `,
      )
    }
    const matches = required.accepts.filter(accepts => accepts.network === deps.network)
    if (matches.length === 0) {
      const offered = [...new Set(required.accepts.map(accepts => accepts.network))].join(', ')
      throw new X402Error(
        'network-unsupported',
        `server accepts payment on ${offered}; the wallet is configured for ${deps.network}.`,
      )
    }
    const chosen = matches[0]
    /* v8 ignore next 3 -- the length check above guarantees a first element; TS cannot narrow indexing. */
    if (chosen === undefined) throw new X402Error('network-unsupported', 'server accepted no payable requirement.')
    if (chosen.asset.toLowerCase() !== asset.address.toLowerCase()) {
      throw new X402Error(
        'asset-unsupported',
        `server wants asset ${chosen.asset}; the wallet pays the ${deps.network} default ${asset.address}.`,
      )
    }
    return {
      scheme: chosen.scheme,
      network: chosen.network,
      amountRaw: chosen.amount,
      amountUsdc: formatUsdc(chosen.amount, decimals),
      resource: required.resource.url,
      description: required.resource.description ?? 'x402 resource',
      payTo: chosen.payTo,
      maxTimeoutSeconds: chosen.maxTimeoutSeconds,
    }
  }

  /** Abort before signing when the requirement exceeds the caller's cap. */
  function enforceCap(requirement: X402PaymentRequirement, capUsdc: number): void {
    const capRaw = BigInt(Math.round(capUsdc * 10 ** decimals))
    if (BigInt(requirement.amountRaw) > capRaw) {
      throw new X402Error(
        'cap-exceeded',
        `this call costs ${requirement.amountUsdc} USDC, above the ${capUsdc.toFixed(6)} USDC cap. `
          + 'Nothing was paid. Raise maxCostUsdc only if the user explicitly agrees.',
      )
    }
  }

  return {
    async estimate(url, init) {
      const response = await deps.fetch(url, init)
      if (response.status !== 402) return { status: response.status }
      const body = await tryJson(response)
      const required = http.getPaymentRequiredResponse(name => response.headers.get(name), body)
      return { status: 402, requirement: selectRequirement(required) }
    },

    async pay(url, init, capUsdc, confirm) {
      const probe = await deps.fetch(url, init)
      if (probe.status !== 402) {
        const body = await tryJson(probe) as JsonValue
        return { url, status: probe.status, paymentStatus: 'none', body }
      }
      const body = await tryJson(probe)
      const required = http.getPaymentRequiredResponse(name => probe.headers.get(name), body)
      const requirement = selectRequirement(required)
      enforceCap(requirement, capUsdc)
      if (confirm !== undefined) await confirm(requirement)
      await requireAccount()
      const payload = await http.createPaymentPayload(required)
      const signatureHeaders = http.encodePaymentSignatureHeader(payload)
      const paid = await deps.fetch(url, {
        ...init,
        headers: { ...(init.headers as Record<string, string> | undefined), ...signatureHeaders },
      })
      const parsed = await http.processResponse(paid)
      const settle = parsed.header !== undefined && 'transaction' in parsed.header ? parsed.header : undefined
      return {
        url,
        status: parsed.status,
        paymentStatus: parsed.paymentStatus,
        body: parsed.body as JsonValue,
        ...(settle?.transaction === undefined ? {} : { transaction: settle.transaction }),
        ...(settle?.payer === undefined ? {} : { payer: settle.payer }),
      }
    },

    async address() {
      return (await requireAccount()).address
    },

    async balance(address) {
      const raw = await thisPublic().readContract({
        address: asset.address as Address,
        abi: BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [address],
      })
      return formatUsdc(raw.toString(), decimals)
    },

    async send(to, amountUsdc) {
      const account = await requireAccount()
      const amount = parseUsdcAmount(amountUsdc, decimals)
      if (amount <= 0n) throw new X402Error('invalid-amount', 'USDC amount must be positive')
      const publicClient = thisPublic()
      const held = await publicClient.readContract({
        address: asset.address as Address,
        abi: BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [account.address],
      })
      if (held < amount) {
        throw new X402Error('insufficient-balance', `insufficient USDC: wallet holds ${formatUsdc(held.toString(), decimals)}, requested ${amountUsdc}`)
      }
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, amount],
      })
      let gas: bigint
      try {
        gas = await publicClient.estimateGas({ account: account.address, to: asset.address as Address, data })
      } catch (error) {
        throw new X402Error('transfer-failed', `transfer estimate failed: ${errorMessage(error)}`)
      }
      const walletClient = createWalletClient({ account, chain: base, transport: createRpcTransport(deps.fetch, deps.rpcUrl) })
      let transaction: Hex
      try {
        transaction = await walletClient.sendTransaction({ to: asset.address as Address, data, gas })
      } catch (error) {
        throw new X402Error('transfer-failed', `transfer broadcast failed: ${errorMessage(error)}`)
      }
      /* v8 ignore next 3 -- viem resolves on status-0x0 receipts; only timeout/transport rejects here. */
      await publicClient.waitForTransactionReceipt({ hash: transaction }).catch(() => {
        throw new X402Error('transfer-failed', 'transfer confirmed but receipt read failed')
      })
      return { transaction }
    },

    async history(address, limit = 50) {
      const publicClient = thisPublic()
      const toBlock = await publicClient.getBlockNumber()
      const fromBlock = toBlock - (deps.historyBlockRange ?? DEFAULT_HISTORY_BLOCK_RANGE)
      const [outLogs, inLogs] = await Promise.all([
        publicClient.getLogs({ address: asset.address as Address, event: TRANSFER_EVENT, args: { from: address }, fromBlock, toBlock }),
        publicClient.getLogs({ address: asset.address as Address, event: TRANSFER_EVENT, args: { to: address }, fromBlock, toBlock }),
      ])
      const entries = [
        ...outLogs.map(log => ({ log, direction: 'out' as const })),
        ...inLogs.map(log => ({ log, direction: 'in' as const })),
      ].flatMap(({ log, direction }) => {
        if (log.args.from === undefined || log.args.to === undefined || log.args.value === undefined) return []
        return [{
          hash: log.transactionHash,
          from: log.args.from,
          to: log.args.to,
          value: log.args.value,
          blockNumber: Number(log.blockNumber),
          direction,
        }]
      })
      return entries
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, limit)
        .map(entry => ({
          hash: entry.hash,
          from: entry.from,
          to: entry.to,
          amountUsdc: formatUsdc(entry.value.toString(), decimals),
          blockNumber: entry.blockNumber,
          direction: entry.direction,
        }))
    },
  }
}
