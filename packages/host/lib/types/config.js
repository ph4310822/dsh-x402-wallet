/**
 * Deployment configuration of the x402 payment plugin.
 * @module @deepseek-ai/dsh-x402/config
 */
import s from '@deepseek-ai/schemastery';
/** Loader-validated x402 configuration with deployment defaults. */
export const X402ConfigSchema = s.object({
    rpcUrl: s.string().default('https://mainnet.base.org'),
    network: s.string().default('eip155:8453'),
    catalogUrl: s.string().default('https://x402mcp.app/catalog.json'),
    defaultMaxCostUsdc: s.number().min(0).default(1),
    approvalRequired: s.boolean().default(true),
    keyRef: s.string().default('X402_PRIVATE_KEY'),
});
//# sourceMappingURL=config.js.map