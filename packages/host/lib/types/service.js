/**
 * x402 payment service: protocol calls, wallet state, payment history, and the
 * GUI-facing remote surface. The wallet key resolves per operation through
 * `ctx.credentials`; every paid call enforces a spending cap and asks the user
 * for approval first.
 * @module @deepseek-ai/dsh-x402
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Service } from '@deepseek-ai/cordis';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { X402ConfigSchema } from "./config.js";
import { createX402Protocol, X402Error } from "./protocol.js";
import { X402_SYSTEM_PROMPT } from "./prompt.js";
import { registerX402Tools } from "./tools.js";
/** Process-local payment history depth; the session log remains the durable record. */
const MAX_RECORDS = 100;
/** The x402 payment capability: model tools, GUI remote, and wallet custody. */
let X402Service = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _wallet_decorators;
    let _payments_decorators;
    return class X402Service extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _wallet_decorators = [Remote('wallet')];
            _payments_decorators = [Remote('payments')];
            __esDecorate(this, null, _wallet_decorators, { kind: "method", name: "wallet", static: false, private: false, access: { has: obj => "wallet" in obj, get: obj => obj.wallet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _payments_decorators, { kind: "method", name: "payments", static: false, private: false, access: { has: obj => "payments" in obj, get: obj => obj.payments }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static inject = ['tools', 'credentials', 'approval', 'systemPrompt'];
        static Config = X402ConfigSchema;
        config = __runInitializers(this, _instanceExtraInitializers);
        protocol;
        fetchImpl;
        records = [];
        nextRecord = 1;
        /**
         * @param ctx - Host context carrying tools, credentials, approval, and system-prompt services.
         * @param config - Loader-validated deployment configuration.
         * @param deps - optional injected fetch for tests; defaults to the host global.
         */
        constructor(ctx, config, deps = { fetch: globalThis.fetch }) {
            super(ctx, 'x402');
            this.config = X402ConfigSchema(config);
            this.fetchImpl = deps.fetch;
            this.protocol = createX402Protocol({
                fetch: deps.fetch,
                rpcUrl: this.config.rpcUrl,
                network: this.config.network,
                resolveKey: () => this.resolveKey(),
            });
        }
        [Service.init]() {
            registerX402Tools(this.ctx, this);
            this.ctx.systemPrompt.section({ name: 'tool:x402', order: 116, text: X402_SYSTEM_PROMPT });
        }
        /** Resolve the wallet key per operation; a blank or missing value means unconfigured. */
        async resolveKey() {
            const hit = await this.ctx.credentials.resolve(credentialRef(this.config.keyRef));
            return hit?.value;
        }
        /**
         * List live x402 APIs from the catalog, optionally filtered.
         * @param keyword - substring filter against descriptions and URLs.
         * @param network - exact CAIP-2 network filter.
         * @returns at most the first 25 matching entries.
         */
        async discover(keyword, network) {
            const response = await this.fetchImpl(this.config.catalogUrl);
            if (!response.ok) {
                throw new Error(`x402 catalog unreachable: HTTP ${response.status}`);
            }
            const catalog = await response.json();
            const needle = keyword?.toLowerCase();
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
            }));
        }
        /**
         * Probe one URL for its payment requirement without paying.
         * @param url - resource to probe.
         * @param method - HTTP method for the probe; defaults to GET.
         * @returns free or one concrete requirement.
         */
        async estimate(url, method) {
            const probe = await this.protocol.estimate(url, {
                method: method ?? 'GET',
                headers: { accept: 'application/json' },
            });
            if (probe.requirement === undefined)
                return { requiresPayment: false, status: probe.status };
            return { requiresPayment: true, requirement: probe.requirement };
        }
        /**
         * Read the wallet snapshot: configured status, address, and USDC balance.
         * @returns wallet state; balance RPC failures surface loud.
         */
        async wallet() {
            const key = await this.resolveKey();
            if (key === undefined || key.trim().length === 0) {
                return { configured: false, network: this.config.network };
            }
            const address = await this.protocol.address();
            const usdcBalance = await this.protocol.balance(address);
            return { configured: true, address, usdcBalance, network: this.config.network };
        }
        /**
         * Read the process-local payment history, newest first.
         * @returns the recorded settled and failed paid calls.
         */
        payments() {
            return Promise.resolve([...this.records].reverse());
        }
        /**
         * Pay and call one x402 URL on behalf of an agent: probe, enforce the cap,
         * ask the user for approval, sign, retry, and record the outcome.
         * @param request - URL, call options, cap, and the asking agent.
         * @returns the parsed receipt of the paid call.
         */
        async payForAgent(request) {
            const cap = request.maxCostUsdc ?? this.config.defaultMaxCostUsdc;
            const init = {
                method: request.method ?? 'GET',
                ...(request.headers === undefined ? {} : { headers: request.headers }),
                ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
            };
            let paidAmount = '0.000000';
            const receipt = await this.protocol.pay(request.url, init, cap, async (requirement) => {
                paidAmount = requirement.amountUsdc;
                if (!this.config.approvalRequired)
                    return;
                const outcome = await this.ctx.approval.request({
                    agent: request.agent,
                    toolName: 'x402_pay',
                    ...(request.callId === undefined ? {} : { callId: request.callId }),
                    reason: `x402 支付 ${requirement.amountUsdc} USDC 给 ${requirement.payTo}，用于 ${requirement.resource}`,
                    ...(request.signal === undefined ? {} : { signal: request.signal }),
                });
                if (outcome === 'rejected' || outcome === 'cancelled') {
                    throw new X402Error('rejected', 'x402 支付被拒绝，未发生任何扣款。');
                }
                if (outcome === 'unavailable') {
                    throw new X402Error('rejected', '没有可用的审批应答者，x402 支付已安全拒绝。');
                }
            });
            if (receipt.paymentStatus === 'settled' || receipt.paymentStatus === 'settle_failed') {
                this.record({
                    url: request.url,
                    amountUsdc: paidAmount,
                    ...(receipt.transaction === undefined ? {} : { transaction: receipt.transaction }),
                    status: receipt.paymentStatus === 'settled' ? 'settled' : 'failed',
                });
            }
            return receipt;
        }
        /** Append one payment to the process-local ring and broadcast it to the GUI. */
        record(entry) {
            const record = {
                ...entry,
                id: `x402-${this.nextRecord++}`,
                network: this.config.network,
                time: Date.now(),
            };
            this.records.push(record);
            if (this.records.length > MAX_RECORDS)
                this.records.shift();
            this.ctx.emit('x402/payment', record);
        }
    };
})();
export { X402Service };
export default X402Service;
//# sourceMappingURL=service.js.map