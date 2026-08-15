/**
 * Model-facing x402 tools: discover, estimate, balance, and pay.
 * @module @deepseek-ai/dsh-x402/tools
 */
import type { Context } from '@deepseek-ai/cordis';
import type { JsonValue } from '@deepseek-ai/dsh-session/types';
import type { X402Service } from './index.ts';
/** One paid-call request the tool layer forwards to the service. */
export interface X402PayToolArgs {
    url: string;
    maxCostUsdc?: number | undefined;
    method?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: JsonValue | undefined;
}
/**
 * Register every model-facing x402 tool on the given context.
 * @param ctx - context carrying the tool registry.
 * @param service - x402 service the tools call.
 */
export declare function registerX402Tools(ctx: Context, service: X402Service): void;
//# sourceMappingURL=tools.d.ts.map