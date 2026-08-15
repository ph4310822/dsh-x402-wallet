/**
 * x402 payment service: protocol calls, wallet state, payment history, and the
 * GUI-facing remote surface. The wallet key resolves per operation through
 * `ctx.credentials`; every paid call enforces a spending cap and asks the user
 * for approval first.
 * @module @deepseek-ai/dsh-x402
 */
import { Context, Service } from '@deepseek-ai/cordis';
import s from '@deepseek-ai/schemastery';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { type CallId } from '@deepseek-ai/dsh-llm';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { X402Config } from './config.ts';
import type { X402PayToolArgs } from './tools.ts';
import type { X402CatalogEntry, X402EstimateResult, X402PaymentReceipt, X402PaymentRecord, X402WalletState } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        /** x402 payment service: protocol calls, wallet state, and payment history. */
        x402: X402Service;
    }
}
/** Injectable construction inputs that keep the service socket-free in tests. */
export interface X402ServiceDeps {
    /** Fetch implementation; production uses the host global. */
    fetch: typeof fetch;
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
    /**
     * @param ctx - Host context carrying tools, credentials, approval, and system-prompt services.
     * @param config - Loader-validated deployment configuration.
     * @param deps - optional injected fetch for tests; defaults to the host global.
     */
    constructor(ctx: Context, config: X402Config, deps?: X402ServiceDeps);
    protected [Service.init](): void;
    /** Resolve the wallet key per operation; a blank or missing value means unconfigured. */
    private resolveKey;
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
    /** Append one payment to the process-local ring and broadcast it to the GUI. */
    private record;
}
export default X402Service;
//# sourceMappingURL=service.d.ts.map