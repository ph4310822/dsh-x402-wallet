/**
 * Native x402 protocol client: probe a 402 challenge, enforce a spending cap,
 * sign a payment authorization with the wallet key, retry with the proof, and
 * parse the settlement. All network access goes through an injected fetch so
 * unit tests run without sockets.
 * @module @deepseek-ai/dsh-x402/protocol
 */
import type { Network } from '@x402/core/types';
import type { Address, Hex } from 'viem';
import type { X402HistoryEntry, X402PaymentReceipt, X402PaymentRequirement } from './types.ts';
/** Machine-readable x402 failure codes the tools and GUI can branch on. */
export type X402ErrorCode = 'wallet-not-configured' | 'network-unsupported' | 'asset-unsupported' | 'cap-exceeded' | 'version-unsupported' | 'rejected' | 'invalid-amount' | 'insufficient-balance' | 'transfer-failed' | 'invalid-wallet' | 'wallet-not-found';
/** One protocol failure with a stable code and a model-facing message. */
export declare class X402Error extends Error {
    readonly code: X402ErrorCode;
    readonly name = "X402Error";
    constructor(code: X402ErrorCode, message: string);
}
/** Result of one payment probe: either free or one concrete requirement. */
export interface X402EstimateProbe {
    /** HTTP status of the first request. */
    status: number;
    /** The parsed requirement when the server answered 402. */
    requirement?: X402PaymentRequirement;
}
/** The protocol surface the service and tests share. */
export interface X402Protocol {
    /**
     * Probe one URL for its payment requirement without paying.
     * @param url - resource to probe.
     * @param init - optional request options (headers, method, body).
     * @returns the HTTP status and the parsed requirement, when the server asked for payment.
     */
    estimate(url: string, init?: RequestInit): Promise<X402EstimateProbe>;
    /**
     * Pay and call one x402 URL in one step.
     * @param url - resource to pay for and call.
     * @param init - request options for both the probe and the paid call.
     * @param capUsdc - hard spending cap in USDC units; the call aborts before signing when exceeded.
     * @param confirm - optional hook invoked with the concrete requirement between probe and signing (approval).
     * @returns the parsed receipt of the paid call.
     */
    pay(url: string, init: RequestInit, capUsdc: number, confirm?: (requirement: X402PaymentRequirement) => Promise<void>): Promise<X402PaymentReceipt>;
    /** Derive the wallet address from the resolved key. */
    address(): Promise<Address>;
    /** Read the human USDC balance of the wallet on the payment network. */
    balance(address: Address): Promise<string>;
    /**
     * Broadcast a USDC transfer from the current wallet and wait for confirmation.
     * @param to - recipient address.
     * @param amountUsdc - human USDC amount, e.g. `1.25`.
     * @returns the confirmed transaction hash.
     */
    send(to: Address, amountUsdc: string): Promise<{
        transaction: Hex;
    }>;
    /**
     * Read recent on-chain USDC transfers touching one address, newest first.
     * @param address - wallet address to inspect.
     * @param limit - maximum entries; defaults to 50.
     * @returns transfers where the address sent or received.
     */
    history(address: Address, limit?: number): Promise<X402HistoryEntry[]>;
}
/** Injectable inputs that keep the protocol socket-free in tests. */
export interface X402ProtocolDeps {
    /** Fetch implementation; production uses the host global. */
    fetch: typeof fetch;
    /** JSON-RPC endpoint for the payment network (balance reads). */
    rpcUrl: string;
    /** CAIP-2 network the wallet pays on. */
    network: Network;
    /** On-chain history window in blocks; public RPCs cap `eth_getLogs` ranges. */
    historyBlockRange?: bigint;
    /** Resolve the wallet private key from the credential store, per operation. */
    resolveKey: () => Promise<string | undefined>;
}
/** Default on-chain history window in blocks (~5 days on Base). */
export declare const DEFAULT_HISTORY_BLOCK_RANGE = 200000n;
/**
 * Parse a human USDC amount into the token's smallest unit.
 * @param amountUsdc - decimal string, e.g. `1.25`.
 * @param decimals - token decimals (6 for USDC).
 * @returns the raw amount; throws `invalid-amount` on malformed input.
 */
export declare function parseUsdcAmount(amountUsdc: string, decimals: number): bigint;
/**
 * Format a raw token amount as a fixed-decimal USDC string.
 * @param raw - amount in the token's smallest unit.
 * @param decimals - token decimals (6 for USDC).
 * @returns a six-fraction-digit USDC string.
 */
export declare function formatUsdc(raw: string, decimals: number): string;
/**
 * Create the payment protocol bound to one network and one credential source.
 * @param deps - network, RPC endpoint, and the per-operation key resolver.
 * @returns the protocol surface the service and tests share.
 */
export declare function createX402Protocol(deps: X402ProtocolDeps): X402Protocol;
//# sourceMappingURL=protocol.d.ts.map