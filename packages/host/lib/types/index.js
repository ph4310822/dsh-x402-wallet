/**
 * x402 payment capability: native @x402 protocol client, wallet via
 * `ctx.credentials`, model-facing discover/estimate/pay/balance tools, and a
 * GUI-facing wallet remote.
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
import s from '@deepseek-ai/schemastery';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { isAddress } from 'viem';
import { createX402Protocol, X402Error } from "./protocol.js";
import { X402_SYSTEM_PROMPT } from "./prompt.js";
import { registerX402Tools } from "./tools.js";
import { keyRefOf, mintWalletId, StorageWalletStore, walletRecord, x402WalletDomainSpec, } from "./wallet.js";
/** Process-local payment history depth; the session log remains the durable record. */
const MAX_RECORDS = 100;
/** The x402 payment capability: model tools, GUI remote, and wallet custody. */
let X402Service = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _wallet_decorators;
    let _wallets_decorators;
    let _createWallet_decorators;
    let _selectWallet_decorators;
    let _send_decorators;
    let _history_decorators;
    let _payments_decorators;
    return class X402Service extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _wallet_decorators = [Remote('wallet')];
            _wallets_decorators = [Remote('wallets')];
            _createWallet_decorators = [Remote('createWallet')];
            _selectWallet_decorators = [Remote('selectWallet')];
            _send_decorators = [Remote('send')];
            _history_decorators = [Remote('history')];
            _payments_decorators = [Remote('payments')];
            __esDecorate(this, null, _wallet_decorators, { kind: "method", name: "wallet", static: false, private: false, access: { has: obj => "wallet" in obj, get: obj => obj.wallet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _wallets_decorators, { kind: "method", name: "wallets", static: false, private: false, access: { has: obj => "wallets" in obj, get: obj => obj.wallets }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createWallet_decorators, { kind: "method", name: "createWallet", static: false, private: false, access: { has: obj => "createWallet" in obj, get: obj => obj.createWallet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _selectWallet_decorators, { kind: "method", name: "selectWallet", static: false, private: false, access: { has: obj => "selectWallet" in obj, get: obj => obj.selectWallet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _send_decorators, { kind: "method", name: "send", static: false, private: false, access: { has: obj => "send" in obj, get: obj => obj.send }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _history_decorators, { kind: "method", name: "history", static: false, private: false, access: { has: obj => "history" in obj, get: obj => obj.history }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _payments_decorators, { kind: "method", name: "payments", static: false, private: false, access: { has: obj => "payments" in obj, get: obj => obj.payments }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static inject = ['tools', 'credentials', 'approval', 'systemPrompt', 'storageDomain'];
        static Config = s.object({
            rpcUrl: s.string().default('https://mainnet.base.org'),
            network: s.string().default('eip155:8453'),
            catalogUrl: s.string().default('https://x402mcp.app/catalog.json'),
            defaultMaxCostUsdc: s.number().min(0).default(1),
            approvalRequired: s.boolean().default(true),
            keyRef: s.string().default('X402_PRIVATE_KEY'),
            historyBlockRange: s.natural().min(1).max(100_000).default(10_000),
        });
        config = __runInitializers(this, _instanceExtraInitializers);
        protocol;
        fetchImpl;
        records = [];
        nextRecord = 1;
        walletStore;
        paymentsTable;
        /**
         * @param ctx - Host context carrying tools, credentials, approval, and system-prompt services.
         * @param config - Loader-validated deployment configuration.
         * @param deps - optional injected fetch for tests; defaults to the host global.
         */
        constructor(ctx, config, deps = { fetch: globalThis.fetch }) {
            super(ctx, 'x402');
            this.config = X402Service.Config(config);
            this.fetchImpl = deps.fetch;
            this.walletStore = deps.walletStore;
            this.protocol = createX402Protocol({
                fetch: deps.fetch,
                rpcUrl: this.config.rpcUrl,
                network: this.config.network,
                historyBlockRange: BigInt(this.config.historyBlockRange),
                resolveKey: () => this.resolveCurrentKey(),
            });
        }
        async [Service.init]() {
            registerX402Tools(this.ctx, this);
            this.ctx.systemPrompt.section({ name: 'tool:x402', order: 116, text: X402_SYSTEM_PROMPT });
            /* v8 ignore next 1 -- plugin mounts never carry an injected store; direct constructions never run init. */
            if (this.walletStore === undefined) {
                const domain = await this.ctx.storageDomain.open(x402WalletDomainSpec);
                this.ctx.effect(() => async () => {
                    await domain.close();
                }, 'x402.walletDomainClose');
                this.walletStore = new StorageWalletStore(domain);
                this.paymentsTable = domain.table('payments');
                this.restorePayments(this.paymentsTable);
                await this.seedLegacyWallet();
            }
        }
        /** The durable wallet registry; unavailable only before init in direct constructions. */
        requireWalletStore() {
            if (this.walletStore === undefined) {
                throw new X402Error('wallet-not-configured', 'x402 wallet store is not initialized');
            }
            return this.walletStore;
        }
        /** The selected wallet, or a loud refusal when none exists. */
        async requireCurrentWallet() {
            const store = this.requireWalletStore();
            const current = await store.current();
            if (current === undefined) {
                throw new X402Error('wallet-not-configured', 'No wallet yet — create one in the wallet panel first.');
            }
            return current;
        }
        /** Resolve the current wallet's key per operation; a blank or missing value means unconfigured. */
        async resolveCurrentKey() {
            const store = this.walletStore;
            if (store !== undefined) {
                const current = await store.current();
                if (current !== undefined) {
                    return (await this.ctx.credentials.resolve(credentialRef(current.keyRef)))?.value;
                }
            }
            const hit = await this.ctx.credentials.resolve(credentialRef(this.config.keyRef));
            return hit?.value;
        }
        /** Seed a wallet from the legacy single-key credential so existing setups keep working. */
        async seedLegacyWallet() {
            const store = this.walletStore;
            /* v8 ignore next 1 -- init assigns the store before seeding; the guard is defensive. */
            if (store === undefined)
                return;
            if ((await store.list()).length > 0)
                return;
            const hit = await this.ctx.credentials.resolve(credentialRef(this.config.keyRef));
            if (hit === undefined || hit.value.trim().length === 0)
                return;
            const address = privateKeyToAccount(hit.value.trim()).address;
            const wallet = {
                id: mintWalletId(),
                label: 'Default wallet',
                address,
                keyRef: this.config.keyRef,
                createdAt: Date.now(),
            };
            await store.create(wallet);
            await store.setCurrent(wallet.id);
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
            const current = this.walletStore === undefined ? undefined : await this.walletStore.current();
            const key = await this.resolveCurrentKey();
            if (key === undefined || key.trim().length === 0) {
                return { configured: false, network: this.config.network };
            }
            const address = await this.protocol.address();
            const usdcBalance = await this.protocol.balance(address);
            return {
                configured: true,
                address,
                usdcBalance,
                network: this.config.network,
                ...(current === undefined ? {} : { label: current.label, walletId: current.id }),
            };
        }
        /**
         * List every wallet in the registry, marking the selected one.
         * @returns wallet records with the current selection flagged.
         */
        async wallets() {
            const store = this.requireWalletStore();
            const current = await store.current();
            const all = await store.list();
            return all.map(wallet => walletRecord(wallet, current?.id === wallet.id));
        }
        /**
         * Create a wallet: generate a fresh key, or import a provided one. The key
         * is written to the credentials store; the registry keeps only public data.
         * @param request - label and an optional private key to import.
         * @returns the new wallet record; it becomes the selection when it is the first.
         */
        async createWallet(request) {
            const store = this.requireWalletStore();
            const label = request.label.trim();
            if (label.length === 0)
                throw new X402Error('invalid-wallet', 'Wallet label must not be empty.');
            const id = mintWalletId();
            const keyRef = keyRefOf(id);
            const privateKey = request.privateKey?.trim();
            let key;
            if (privateKey === undefined || privateKey.length === 0) {
                key = generatePrivateKey();
            }
            else {
                try {
                    privateKeyToAccount(privateKey);
                }
                catch {
                    throw new X402Error('invalid-wallet', 'The imported private key is invalid.');
                }
                key = privateKey;
            }
            await this.ctx.credentials.set(credentialRef(keyRef), key);
            const address = privateKeyToAccount(key).address;
            const wallet = { id, label, address, keyRef, createdAt: Date.now() };
            await store.create(wallet);
            if ((await store.current()) === undefined)
                await store.setCurrent(id);
            return walletRecord(wallet, (await store.current())?.id === id);
        }
        /**
         * Make one wallet the selection used by payments and transfers.
         * @param id - durable wallet id from `wallets()`.
         * @returns confirmation once the selection is durably written.
         */
        async selectWallet(id) {
            const store = this.requireWalletStore();
            if ((await store.get(id)) === undefined)
                throw new X402Error('wallet-not-found', `x402: unknown wallet ${id}`);
            await store.setCurrent(id);
            return { ok: true };
        }
        /**
         * Send USDC from the current wallet to an address and wait for confirmation.
         * @param request - recipient and human USDC amount.
         * @returns the confirmed transaction receipt.
         */
        async send(request) {
            await this.requireCurrentWallet();
            const to = request.to.trim();
            if (!isAddress(to))
                throw new X402Error('invalid-wallet', `Invalid recipient address "${request.to}".`);
            const { transaction } = await this.protocol.send(to, request.amountUsdc);
            return { transaction, to, amountUsdc: request.amountUsdc, status: 'confirmed' };
        }
        /**
         * Read recent on-chain USDC transfers touching the current wallet.
         * @param limit - maximum entries; defaults to 50.
         * @returns transfers newest first with direction and human amounts.
         */
        async history(limit) {
            const current = await this.requireCurrentWallet();
            return this.protocol.history(current.address, limit);
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
                    reason: `x402 pay ${requirement.amountUsdc} USDC to ${requirement.payTo} for ${requirement.resource}`,
                    ...(request.signal === undefined ? {} : { signal: request.signal }),
                });
                if (outcome === 'rejected' || outcome === 'cancelled') {
                    throw new X402Error('rejected', 'The x402 payment was rejected; nothing was charged.');
                }
                if (outcome === 'unavailable') {
                    throw new X402Error('rejected', 'No approval responder is available; the x402 payment was safely rejected.');
                }
            });
            if (receipt.paymentStatus === 'settled' || receipt.paymentStatus === 'settle_failed') {
                await this.record({
                    url: request.url,
                    amountUsdc: paidAmount,
                    ...(receipt.transaction === undefined ? {} : { transaction: receipt.transaction }),
                    status: receipt.paymentStatus === 'settled' ? 'settled' : 'failed',
                });
            }
            return receipt;
        }
        /** Reload the durable payment ring from the domain; the ring stays capped at the newest records. */
        restorePayments(table) {
            const rows = [...table.entries()].map(([, record]) => record).sort((a, b) => a.time - b.time);
            this.records.push(...rows.slice(-MAX_RECORDS));
            const ids = rows.map(record => Number(record.id.replace(/^x402-/, ''))).filter(Number.isFinite);
            if (ids.length > 0)
                this.nextRecord = Math.max(...ids) + 1;
        }
        /** Append one payment to the ring, persist it, and broadcast it to the GUI. */
        async record(entry) {
            const record = {
                ...entry,
                id: `x402-${this.nextRecord++}`,
                network: this.config.network,
                time: Date.now(),
            };
            this.records.push(record);
            const evicted = this.records.length > MAX_RECORDS ? this.records.shift() : undefined;
            const table = this.paymentsTable;
            if (table !== undefined) {
                // Persistence is best-effort: a failed write must not fail the paid call.
                try {
                    await table.put(record.id, record);
                    /* v8 ignore next 2 -- eviction with a live table needs 101 real paid calls; the in-memory depth cap covers the shift logic. */
                    if (evicted !== undefined)
                        await table.delete(evicted.id);
                }
                catch {
                    // Storage is down — the in-memory ring and the session log still hold the record.
                }
            }
            this.ctx.emit('x402/payment', record);
        }
    };
})();
export { X402Service };
export { createX402Protocol, X402Error, formatUsdc, parseUsdcAmount } from "./protocol.js";
export { X402_SYSTEM_PROMPT } from "./prompt.js";
export default X402Service;
//# sourceMappingURL=index.js.map