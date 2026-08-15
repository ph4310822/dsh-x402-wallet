/**
 * Deployment configuration of the x402 payment plugin.
 * @module @deepseek-ai/dsh-x402/config
 */
import s from '@deepseek-ai/schemastery';
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
}
/** Loader-validated x402 configuration with deployment defaults. */
export declare const X402ConfigSchema: s<X402Config>;
//# sourceMappingURL=config.d.ts.map