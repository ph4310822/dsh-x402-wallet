/**
 * x402 payment capability: native @x402 protocol client, wallet via
 * `ctx.credentials`, model-facing discover/estimate/pay/balance tools, and a
 * GUI-facing wallet remote.
 * @module @deepseek-ai/dsh-x402
 */
import { Context, Service } from '@deepseek-ai/cordis';
import s from '@deepseek-ai/schemastery';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { type CallId } from '@deepseek-ai/dsh-llm';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { X402PayToolArgs } from './tools.ts';
import type { X402CatalogEntry, X402EstimateResult, X402HistoryEntry, X402PaymentReceipt, X402PaymentRecord, X402SendReceipt, X402WalletRecord, X402WalletState } from './types.ts';
import type { X402WalletStore } from './wallet.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        /** x402 payment service: protocol calls, wallet state, and payment history. */
        x402: X402Service;
    }
}
/** Deployment-varying x402 choices, changeable from cordis.yml. */
export interface X402Config {
    /** JSON-RPC endpoint of the payment network (USDC balance reads). */
    rpcUrl?: string;
    /** CAIP-2 network the wallet pays on. */
    network?: string;
    /** URL of the discoverable x402 API catalog. */
    catalogUrl?: string;
    /** Default per-call spending cap in USDC when the model omits maxCostUsdc. */
    defaultMaxCostUsdc?: number;
    /** Whether every paid call first asks the user for approval. */
    approvalRequired?: boolean;
    /** Credential reference for the payment wallet private key. */
    keyRef?: string;
    /** On-chain history window in blocks; public RPCs reject `eth_getLogs` ranges at or above 10000 (default 9000). */
    historyBlockRange?: number;
}
/** Injectable construction inputs that keep the service socket-free in tests. */
export interface X402ServiceDeps {
    /** Fetch implementation; production uses the host global. */
    fetch: typeof fetch;
    /** Durable wallet registry; production opens the storage domain in init. */
    walletStore?: X402WalletStore;
}
/** The x402 payment capability: model tools, GUI remote, and wallet custody. */
export declare class X402Service extends TypertRemoteService {
    static inject: string[];
    static Config: s<X402Config>;
    private readonly config;
    private readonly protocol;
    private readonly fetchImpl;
    private readonly records;
    private nextRecord;
    private walletStore;
    private paymentsTable;
    /**
     * @param ctx - Host context carrying tools, credentials, approval, and system-prompt services.
     * @param config - Loader-validated deployment configuration.
     * @param deps - optional injected fetch for tests; defaults to the host global.
     */
    constructor(ctx: Context, config: X402Config, deps?: X402ServiceDeps);
    protected [Service.init](): Promise<void>;
    /** The durable wallet registry; unavailable only before init in direct constructions. */
    private requireWalletStore;
    /** The selected wallet, or a loud refusal when none exists. */
    private requireCurrentWallet;
    /** Resolve the current wallet's key per operation; a blank or missing value means unconfigured. */
    private resolveCurrentKey;
    /** Seed a wallet from the legacy single-key credential so existing setups keep working. */
    private seedLegacyWallet;
    /**
     * List live x402 APIs from the catalog, optionally filtered.
     * @param keyword - substring filter against descriptions and URLs.
     * @param network - exact CAIP-2 network filter.
     * @returns at most the first 25 matching entries.
     */
    discover(keyword?: string, network?: string): Promise<X402CatalogEntry[]>;
    /**
     * Probe one URL for its payment requirement without paying.
     * @param url - resource to probe.
     * @param method - HTTP method for the probe; defaults to GET.
     * @returns free or one concrete requirement.
     */
    estimate(url: string, method?: string): Promise<X402EstimateResult>;
    /**
     * Read the wallet snapshot: configured status, address, and USDC balance.
     * @returns wallet state; balance RPC failures surface loud.
     */
    wallet(): Promise<X402WalletState>;
    /**
     * List every wallet in the registry, marking the selected one.
     * @returns wallet records with the current selection flagged.
     */
    wallets(): Promise<X402WalletRecord[]>;
    /**
     * Create a wallet: generate a fresh key, or import a provided one. The key
     * is written to the credentials store; the registry keeps only public data.
     * @param request - label and an optional private key to import.
     * @returns the new wallet record; it becomes the selection when it is the first.
     */
    createWallet(request: {
        label: string;
        privateKey?: string;
    }): Promise<X402WalletRecord>;
    /**
     * Make one wallet the selection used by payments and transfers.
     * @param id - durable wallet id from `wallets()`.
     * @returns confirmation once the selection is durably written.
     */
    selectWallet(id: string): Promise<{
        ok: true;
    }>;
    /**
     * Send USDC from the current wallet to an address and wait for confirmation.
     * @param request - recipient and human USDC amount.
     * @returns the confirmed transaction receipt.
     */
    send(request: {
        to: string;
        amountUsdc: string;
    }): Promise<X402SendReceipt>;
    /**
     * Read recent on-chain USDC transfers touching the current wallet.
     * @param limit - maximum entries; defaults to 50.
     * @returns transfers newest first with direction and human amounts.
     */
    history(limit?: number): Promise<X402HistoryEntry[]>;
    /**
     * Read the process-local payment history, newest first.
     * @returns the recorded settled and failed paid calls.
     */
    payments(): Promise<X402PaymentRecord[]>;
    /**
     * Pay and call one x402 URL on behalf of an agent: probe, enforce the cap,
     * ask the user for approval, sign, retry, and record the outcome.
     * @param request - URL, call options, cap, and the asking agent.
     * @returns the parsed receipt of the paid call.
     */
    payForAgent(request: X402PayToolArgs & {
        agent: Agent;
        callId?: CallId;
        signal?: AbortSignal;
    }): Promise<X402PaymentReceipt>;
    /** Reload the durable payment ring from the domain; the ring stays capped at the newest records. */
    private restorePayments;
    /** Append one payment to the ring, persist it, and broadcast it to the GUI. */
    private record;
}
export { createX402Protocol, X402Error, formatUsdc, parseUsdcAmount } from './protocol.ts';
export type { X402ErrorCode, X402EstimateProbe, X402Protocol, X402ProtocolDeps } from './protocol.ts';
export { X402_SYSTEM_PROMPT } from './prompt.ts';
export type * from './types.ts';
export default X402Service;
//# sourceMappingURL=index.d.ts.map