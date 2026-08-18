import { Service } from "@deepseek-ai/cordis";
import s from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, custom, encodeFunctionData, isAddress } from "viem";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme, getDefaultAsset } from "@x402/evm";
import { base } from "viem/chains";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { defineDomain, domainTable } from "@deepseek-ai/dsh-storage-domain";
//#region lib/types/protocol.js
/**
* Native x402 protocol client: probe a 402 challenge, enforce a spending cap,
* sign a payment authorization with the wallet key, retry with the proof, and
* parse the settlement. All network access goes through an injected fetch so
* unit tests run without sockets.
* @module @deepseek-ai/dsh-x402/protocol
*/
/** One protocol failure with a stable code and a model-facing message. */
var X402Error = class extends Error {
	code;
	name = "X402Error";
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
const BALANCE_OF_ABI = [{
	inputs: [{
		name: "owner",
		type: "address"
	}],
	name: "balanceOf",
	outputs: [{
		name: "",
		type: "uint256"
	}],
	stateMutability: "view",
	type: "function"
}];
/** Minimal ERC-20 transfer ABI (USDC on the payment network). */
const ERC20_ABI = [{
	name: "transfer",
	type: "function",
	stateMutability: "nonpayable",
	inputs: [{
		name: "to",
		type: "address"
	}, {
		name: "value",
		type: "uint256"
	}],
	outputs: [{
		name: "",
		type: "bool"
	}]
}];
/** ERC-20 Transfer event for on-chain history reads. */
const TRANSFER_EVENT = {
	name: "Transfer",
	type: "event",
	inputs: [
		{
			name: "from",
			type: "address",
			indexed: true
		},
		{
			name: "to",
			type: "address",
			indexed: true
		},
		{
			name: "value",
			type: "uint256"
		}
	]
};
/** Per-RPC-call timeout: a hung public node must not stall the GUI refresh. */
const RPC_TIMEOUT_MS = 2e4;
/**
* Parse a human USDC amount into the token's smallest unit.
* @param amountUsdc - decimal string, e.g. `1.25`.
* @param decimals - token decimals (6 for USDC).
* @returns the raw amount; throws `invalid-amount` on malformed input.
*/
function parseUsdcAmount(amountUsdc, decimals) {
	const match = /^(\d+)(?:\.(\d+))?$/.exec(amountUsdc.trim());
	if (match === null) throw new X402Error("invalid-amount", `invalid USDC amount "${amountUsdc}" — use a plain decimal like 1.25`);
	/* v8 ignore next 1 -- the regex guarantees a whole part; the fallback is defensive. */
	const whole = BigInt(match[1] ?? "0");
	const fraction = (match[2] ?? "").padEnd(decimals, "0").slice(0, decimals);
	/* v8 ignore next 1 -- padding makes fraction non-empty for decimals >= 1; the 0n arm is defensive. */
	const fractionValue = fraction.length === 0 ? 0n : BigInt(fraction);
	return whole * 10n ** BigInt(decimals) + fractionValue;
}
/**
* Build a JSON-RPC custom transport over the injected fetch.
* @param fetchImpl - fetch implementation.
* @param rpcUrl - JSON-RPC endpoint.
* @returns a viem transport usable by public and wallet clients.
*/
function createRpcTransport(fetchImpl, rpcUrl) {
	return custom({ request: async ({ method, params }) => {
		/* v8 ignore next 3 -- viem always supplies params for readContract calls; the fallback is defensive. */
		const rpcBody = JSON.stringify({
			jsonrpc: "2.0",
			id: 1,
			method,
			params: params ?? []
		});
		try {
			const json = await (await fetchImpl(rpcUrl, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: rpcBody,
				signal: AbortSignal.timeout(RPC_TIMEOUT_MS)
			})).json();
			if (json.error !== void 0) throw new Error(`x402 RPC ${method} failed: ${json.error.message ?? "unknown error"}`);
			return json.result;
		} catch (error) {
			if (error instanceof Error && error.name === "TimeoutError") throw new Error(`x402 RPC ${method} timed out after ${RPC_TIMEOUT_MS}ms`);
			throw error;
		}
	} });
}
/**
* Format a raw token amount as a fixed-decimal USDC string.
* @param raw - amount in the token's smallest unit.
* @param decimals - token decimals (6 for USDC).
* @returns a six-fraction-digit USDC string.
*/
function formatUsdc(raw, decimals) {
	const value = BigInt(raw);
	const scale = 10n ** BigInt(decimals);
	return `${value / scale}.${(value % scale).toString().padStart(decimals, "0").slice(0, 6)}`;
}
/** One-line error text for protocol failure messages. */
function errorMessage(error) {
	/* v8 ignore next 1 -- viem and the SDK always throw Errors; String() is defensive. */
	return error instanceof Error ? error.message : String(error);
}
/** Parse a 402 response body without consuming a body the caller may still need. */
async function tryJson(response) {
	try {
		return await response.clone().json();
	} catch {
		return;
	}
}
/**
* Create the payment protocol bound to one network and one credential source.
* @param deps - network, RPC endpoint, and the per-operation key resolver.
* @returns the protocol surface the service and tests share.
*/
function createX402Protocol(deps) {
	const asset = getDefaultAsset(deps.network);
	const decimals = asset.decimals;
	const client = new x402Client();
	const http = new x402HTTPClient(client);
	let account;
	let publicClient;
	/** Build the public client over the injected RPC transport. */
	function makePublic() {
		return createPublicClient({
			chain: base,
			transport: createRpcTransport(deps.fetch, deps.rpcUrl)
		});
	}
	/** The cached public client. */
	function thisPublic() {
		publicClient ??= makePublic();
		return publicClient;
	}
	/** Resolve the signing account from the current wallet key, re-registering the scheme on switch. */
	async function requireAccount() {
		const key = await deps.resolveKey();
		if (key === void 0 || key.trim().length === 0) throw new X402Error("wallet-not-configured", "x402 wallet is not configured. Set the X402_PRIVATE_KEY credential (a dedicated spending wallet, not your main wallet) through the credentials store or environment, then retry.");
		const next = privateKeyToAccount(key.trim());
		if (account === void 0 || account.address !== next.address) {
			account = next;
			client.register(deps.network, new ExactEvmScheme(account));
		}
		return account;
	}
	/** Pick the one accepted requirement this wallet can pay, or fail loud. */
	function selectRequirement(required) {
		if (required.x402Version !== 2) throw new X402Error("version-unsupported", `this server speaks x402 v${required.x402Version}; the plugin pays x402 v2. `);
		const matches = required.accepts.filter((accepts) => accepts.network === deps.network);
		if (matches.length === 0) throw new X402Error("network-unsupported", `server accepts payment on ${[...new Set(required.accepts.map((accepts) => accepts.network))].join(", ")}; the wallet is configured for ${deps.network}.`);
		const chosen = matches[0];
		/* v8 ignore next 3 -- the length check above guarantees a first element; TS cannot narrow indexing. */
		if (chosen === void 0) throw new X402Error("network-unsupported", "server accepted no payable requirement.");
		if (chosen.asset.toLowerCase() !== asset.address.toLowerCase()) throw new X402Error("asset-unsupported", `server wants asset ${chosen.asset}; the wallet pays the ${deps.network} default ${asset.address}.`);
		return {
			scheme: chosen.scheme,
			network: chosen.network,
			amountRaw: chosen.amount,
			amountUsdc: formatUsdc(chosen.amount, decimals),
			resource: required.resource.url,
			description: required.resource.description ?? "x402 resource",
			payTo: chosen.payTo,
			maxTimeoutSeconds: chosen.maxTimeoutSeconds
		};
	}
	/** Abort before signing when the requirement exceeds the caller's cap. */
	function enforceCap(requirement, capUsdc) {
		const capRaw = BigInt(Math.round(capUsdc * 10 ** decimals));
		if (BigInt(requirement.amountRaw) > capRaw) throw new X402Error("cap-exceeded", `this call costs ${requirement.amountUsdc} USDC, above the ${capUsdc.toFixed(6)} USDC cap. Nothing was paid. Raise maxCostUsdc only if the user explicitly agrees.`);
	}
	return {
		async estimate(url, init) {
			const response = await deps.fetch(url, init);
			if (response.status !== 402) return { status: response.status };
			const body = await tryJson(response);
			return {
				status: 402,
				requirement: selectRequirement(http.getPaymentRequiredResponse((name) => response.headers.get(name), body))
			};
		},
		async pay(url, init, capUsdc, confirm) {
			const probe = await deps.fetch(url, init);
			if (probe.status !== 402) {
				const body = await tryJson(probe);
				return {
					url,
					status: probe.status,
					paymentStatus: "none",
					body
				};
			}
			const body = await tryJson(probe);
			const required = http.getPaymentRequiredResponse((name) => probe.headers.get(name), body);
			const requirement = selectRequirement(required);
			enforceCap(requirement, capUsdc);
			if (confirm !== void 0) await confirm(requirement);
			await requireAccount();
			const payload = await http.createPaymentPayload(required);
			const signatureHeaders = http.encodePaymentSignatureHeader(payload);
			const paid = await deps.fetch(url, {
				...init,
				headers: {
					...init.headers,
					...signatureHeaders
				}
			});
			const parsed = await http.processResponse(paid);
			const settle = parsed.header !== void 0 && "transaction" in parsed.header ? parsed.header : void 0;
			return {
				url,
				status: parsed.status,
				paymentStatus: parsed.paymentStatus,
				body: parsed.body,
				...settle?.transaction === void 0 ? {} : { transaction: settle.transaction },
				...settle?.payer === void 0 ? {} : { payer: settle.payer }
			};
		},
		async address() {
			return (await requireAccount()).address;
		},
		async balance(address) {
			return formatUsdc((await thisPublic().readContract({
				address: asset.address,
				abi: BALANCE_OF_ABI,
				functionName: "balanceOf",
				args: [address]
			})).toString(), decimals);
		},
		async send(to, amountUsdc) {
			const account = await requireAccount();
			const amount = parseUsdcAmount(amountUsdc, decimals);
			if (amount <= 0n) throw new X402Error("invalid-amount", "USDC amount must be positive");
			const publicClient = thisPublic();
			const held = await publicClient.readContract({
				address: asset.address,
				abi: BALANCE_OF_ABI,
				functionName: "balanceOf",
				args: [account.address]
			});
			if (held < amount) throw new X402Error("insufficient-balance", `insufficient USDC: wallet holds ${formatUsdc(held.toString(), decimals)}, requested ${amountUsdc}`);
			const data = encodeFunctionData({
				abi: ERC20_ABI,
				functionName: "transfer",
				args: [to, amount]
			});
			let gas;
			try {
				gas = await publicClient.estimateGas({
					account: account.address,
					to: asset.address,
					data
				});
			} catch (error) {
				throw new X402Error("transfer-failed", `transfer estimate failed: ${errorMessage(error)}`);
			}
			const walletClient = createWalletClient({
				account,
				chain: base,
				transport: createRpcTransport(deps.fetch, deps.rpcUrl)
			});
			let transaction;
			try {
				transaction = await walletClient.sendTransaction({
					to: asset.address,
					data,
					gas
				});
			} catch (error) {
				throw new X402Error("transfer-failed", `transfer broadcast failed: ${errorMessage(error)}`);
			}
			/* v8 ignore next 3 -- viem resolves on status-0x0 receipts; only timeout/transport rejects here. */
			await publicClient.waitForTransactionReceipt({ hash: transaction }).catch(() => {
				throw new X402Error("transfer-failed", "transfer confirmed but receipt read failed");
			});
			return { transaction };
		},
		async history(address, limit = 50) {
			const publicClient = thisPublic();
			const toBlock = await publicClient.getBlockNumber();
			const fromBlock = toBlock - (deps.historyBlockRange ?? 9000n);
			const [outLogs, inLogs] = await Promise.all([publicClient.getLogs({
				address: asset.address,
				event: TRANSFER_EVENT,
				args: { from: address },
				fromBlock,
				toBlock
			}), publicClient.getLogs({
				address: asset.address,
				event: TRANSFER_EVENT,
				args: { to: address },
				fromBlock,
				toBlock
			})]);
			return [...outLogs.map((log) => ({
				log,
				direction: "out"
			})), ...inLogs.map((log) => ({
				log,
				direction: "in"
			}))].flatMap(({ log, direction }) => {
				if (log.args.from === void 0 || log.args.to === void 0 || log.args.value === void 0) return [];
				return [{
					hash: log.transactionHash,
					from: log.args.from,
					to: log.args.to,
					value: log.args.value,
					blockNumber: Number(log.blockNumber),
					direction
				}];
			}).sort((a, b) => b.blockNumber - a.blockNumber).slice(0, limit).map((entry) => ({
				hash: entry.hash,
				from: entry.from,
				to: entry.to,
				amountUsdc: formatUsdc(entry.value.toString(), decimals),
				blockNumber: entry.blockNumber,
				direction: entry.direction
			}));
		}
	};
}
//#endregion
//#region lib/types/prompt.js
/**
* System-prompt section teaching the x402 payment tools.
* @module @deepseek-ai/dsh-x402/prompt
*/
/** The model-facing operating rules for the x402 tools. */
const X402_SYSTEM_PROMPT = `
x402 payment tools let you call paid APIs that answer HTTP 402 with a crypto payment requirement.

Workflow:
1. x402_discover — find a live paid API for the task. Filter by keyword or network.
2. x402_estimate — probe the chosen URL to learn the exact cost without paying.
3. x402_balance — confirm the wallet is configured and funded before any payment.
4. x402_pay — pay and call the URL in one step. Always pass maxCostUsdc; the call aborts before paying when the cost exceeds it.

Rules:
- A 200 response needs no payment; x402_pay returns it directly.
- Never raise maxCostUsdc above the configured default without the user explicitly agreeing.
- Prefer the cheapest live API that fits the task.
- Every payment asks the user for approval first; do not claim a payment settled until the tool reports paymentStatus "settled".
- The wallet holds only a small spending float; a failed balance read means the RPC is unreachable, not that funds are gone.
`.trim();
//#endregion
//#region lib/types/tools.js
/**
* Model-facing x402 tools: discover, estimate, balance, and pay.
* @module @deepseek-ai/dsh-x402/tools
*/
function requireAgent(exec) {
	if (exec.agent === void 0) throw new Error("x402 tools require an Agent-backed session");
	return exec.agent;
}
function jsonRender(_args, value) {
	return [{
		type: "text",
		text: JSON.stringify(value, null, 2)
	}];
}
/**
* Register every model-facing x402 tool on the given context.
* @param ctx - context carrying the tool registry.
* @param service - x402 service the tools call.
*/
function registerX402Tools(ctx, service) {
	ctx.tools.register(defineTool({
		name: "x402_discover",
		description: "List live x402-enabled paid APIs from the catalog. Optionally filter by keyword (matched against descriptions and URLs) or by CAIP-2 network (e.g. eip155:8453). Call this before x402_estimate to find an API for a task.",
		parameters: {
			keyword: {
				type: "string",
				description: "Filter by a keyword in the API description or URL."
			},
			network: {
				type: "string",
				description: "Filter by CAIP-2 network identifier."
			}
		},
		output: {
			schema: { type: "json" },
			render: jsonRender
		},
		execute(args, _exec) {
			return service.discover(args.keyword, args.network);
		}
	}));
	ctx.tools.register(defineTool({
		name: "x402_estimate",
		description: "Probe one URL for its x402 payment requirement without paying. A free API answers 200 and needs no payment; a paid API answers 402 with a requirement naming scheme, network, USDC amount, and recipient. Use this before x402_pay to learn the exact cost.",
		parameters: {
			url: {
				type: "string",
				required: true,
				description: "Resource URL to probe for a payment requirement."
			},
			method: {
				type: "string",
				description: "HTTP method for the probe; defaults to GET."
			}
		},
		output: {
			schema: { type: "json" },
			render: jsonRender
		},
		execute(args, _exec) {
			return service.estimate(args.url, args.method);
		}
	}));
	ctx.tools.register(defineTool({
		name: "x402_balance",
		description: "Read the payment wallet: whether it is configured, its address, and its USDC balance on the payment network. Call this before any paid call; a failed balance read means the RPC is unreachable, not that funds are gone.",
		parameters: {},
		output: {
			schema: { type: "json" },
			render: jsonRender
		},
		execute(_args, _exec) {
			return service.wallet();
		}
	}));
	ctx.tools.register(defineTool({
		name: "x402_pay",
		description: "Pay and call one x402-enabled URL in one step. Probes the URL, enforces maxCostUsdc (the call aborts before paying when the cost exceeds it), asks the user for approval with the exact amount, signs the payment with the wallet key, retries with the proof, and returns the API response plus the settlement receipt. A 200 response needs no payment and is returned directly. Default maxCostUsdc is the configured default; do not raise it without explicit user agreement.",
		parameters: {
			url: {
				type: "string",
				required: true,
				description: "Resource URL to pay for and call."
			},
			maxCostUsdc: {
				type: "number",
				description: "Hard spending cap in USDC; the call aborts before paying when exceeded."
			},
			method: {
				type: "string",
				description: "HTTP method for the call; defaults to GET."
			},
			headers: {
				type: "json",
				description: "Optional request headers to send with the call."
			},
			body: {
				type: "json",
				description: "Optional JSON request body for the call."
			}
		},
		output: {
			schema: { type: "json" },
			render: (_args, value) => {
				const receipt = value;
				return [{
					type: "text",
					text: [
						`paymentStatus: ${receipt.paymentStatus}`,
						`http: ${String(receipt.status)}`,
						...receipt.transaction === void 0 ? [] : [`transaction: ${receipt.transaction}`],
						"",
						JSON.stringify(value, null, 2)
					].join("\n")
				}];
			}
		},
		execute(args, exec) {
			return service.payForAgent({
				url: args.url,
				maxCostUsdc: args.maxCostUsdc,
				method: args.method,
				headers: args.headers,
				body: args.body,
				agent: requireAgent(exec),
				callId: exec.callId,
				signal: exec.signal
			});
		}
	}));
}
//#endregion
//#region lib/types/wallet.js
/**
* Durable wallet registry: one row per wallet (public identity + credential
* reference) in a storage domain; the private keys themselves live in the
* credentials store. An in-memory store backs tests.
* @module @deepseek-ai/dsh-x402/wallet
*/
const x402WalletSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
	address: z.string().startsWith("0x"),
	keyRef: z.string().min(1),
	createdAt: z.number().int().nonnegative()
});
const x402PaymentSchema = z.object({
	id: z.string().min(1),
	url: z.string().min(1),
	amountUsdc: z.string().min(1),
	network: z.string().min(1),
	transaction: z.string().optional(),
	status: z.union([z.literal("settled"), z.literal("failed")]),
	time: z.number().int().nonnegative()
});
/** Durable wallet registry domain; the JSON backend persists it under the DSH home. */
const x402WalletDomainSpec = defineDomain({
	name: "x402_wallet",
	version: 0,
	tables: {
		wallets: domainTable(x402WalletSchema),
		meta: domainTable(z.object({ currentId: z.string().min(1) })),
		payments: domainTable(x402PaymentSchema)
	}
});
/** The current-selection meta row key. */
const CURRENT_KEY = "current";
/** Storage-backed wallet store over one opened domain. */
var StorageWalletStore = class {
	wallets;
	meta;
	/**
	* @param domain - opened x402 wallet domain (owned by the service).
	*/
	constructor(domain) {
		this.wallets = domain.table("wallets");
		this.meta = domain.table("meta");
	}
	list() {
		return Promise.resolve([...this.wallets.entries()].map(([, wallet]) => wallet).sort((a, b) => a.createdAt - b.createdAt));
	}
	get(id) {
		return Promise.resolve(this.wallets.get(id));
	}
	current() {
		const meta = this.meta.get(CURRENT_KEY);
		return Promise.resolve(meta === void 0 ? void 0 : this.wallets.get(meta.currentId));
	}
	async create(wallet) {
		await this.wallets.put(wallet.id, wallet);
	}
	async setCurrent(id) {
		await this.meta.put(CURRENT_KEY, { currentId: id });
	}
};
/**
* Mint a fresh durable wallet identity.
* @returns a short random wallet id like `w-1a2b3c4d`.
*/
function mintWalletId() {
	return `w-${randomUUID().slice(0, 8)}`;
}
/**
* Mint the credential reference name for one wallet.
* @param walletId - the durable wallet id.
* @returns the credential reference under which the wallet key is stored.
*/
function keyRefOf(walletId) {
	return `X402_WALLET_${walletId.replace(/[^A-Z0-9_]/gi, "").toUpperCase()}`;
}
/**
* Project one durable wallet row to its GUI record.
* @param wallet - the durable wallet row.
* @param isCurrent - whether this wallet is the selected one.
* @returns the GUI-facing record.
*/
function walletRecord(wallet, isCurrent) {
	return {
		id: wallet.id,
		label: wallet.label,
		address: wallet.address,
		isCurrent
	};
}
//#endregion
//#region lib/types/index.js
/**
* x402 payment capability: native @x402 protocol client, wallet via
* `ctx.credentials`, model-facing discover/estimate/pay/balance tools, and a
* GUI-facing wallet remote.
* @module @deepseek-ai/dsh-x402
*/
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
		else descriptor[key] = _;
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
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
			_wallet_decorators = [Remote("wallet")];
			_wallets_decorators = [Remote("wallets")];
			_createWallet_decorators = [Remote("createWallet")];
			_selectWallet_decorators = [Remote("selectWallet")];
			_send_decorators = [Remote("send")];
			_history_decorators = [Remote("history")];
			_payments_decorators = [Remote("payments")];
			__esDecorate(this, null, _wallet_decorators, {
				kind: "method",
				name: "wallet",
				static: false,
				private: false,
				access: {
					has: (obj) => "wallet" in obj,
					get: (obj) => obj.wallet
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _wallets_decorators, {
				kind: "method",
				name: "wallets",
				static: false,
				private: false,
				access: {
					has: (obj) => "wallets" in obj,
					get: (obj) => obj.wallets
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _createWallet_decorators, {
				kind: "method",
				name: "createWallet",
				static: false,
				private: false,
				access: {
					has: (obj) => "createWallet" in obj,
					get: (obj) => obj.createWallet
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _selectWallet_decorators, {
				kind: "method",
				name: "selectWallet",
				static: false,
				private: false,
				access: {
					has: (obj) => "selectWallet" in obj,
					get: (obj) => obj.selectWallet
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _send_decorators, {
				kind: "method",
				name: "send",
				static: false,
				private: false,
				access: {
					has: (obj) => "send" in obj,
					get: (obj) => obj.send
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _history_decorators, {
				kind: "method",
				name: "history",
				static: false,
				private: false,
				access: {
					has: (obj) => "history" in obj,
					get: (obj) => obj.history
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _payments_decorators, {
				kind: "method",
				name: "payments",
				static: false,
				private: false,
				access: {
					has: (obj) => "payments" in obj,
					get: (obj) => obj.payments
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		static inject = [
			"tools",
			"credentials",
			"approval",
			"systemPrompt",
			"storageDomain"
		];
		static Config = s.object({
			rpcUrl: s.string().default("https://mainnet.base.org"),
			network: s.string().default("eip155:8453"),
			catalogUrl: s.string().default("https://x402mcp.app/catalog.json"),
			defaultMaxCostUsdc: s.number().min(0).default(1),
			approvalRequired: s.boolean().default(true),
			keyRef: s.string().default("X402_PRIVATE_KEY"),
			historyBlockRange: s.natural().min(1).max(1e5).default(9e3)
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
			super(ctx, "x402");
			this.config = X402Service.Config(config);
			this.fetchImpl = deps.fetch;
			this.walletStore = deps.walletStore;
			this.protocol = createX402Protocol({
				fetch: deps.fetch,
				rpcUrl: this.config.rpcUrl,
				network: this.config.network,
				historyBlockRange: BigInt(this.config.historyBlockRange),
				resolveKey: () => this.resolveCurrentKey()
			});
		}
		async [Service.init]() {
			registerX402Tools(this.ctx, this);
			this.ctx.systemPrompt.section({
				name: "tool:x402",
				order: 116,
				text: X402_SYSTEM_PROMPT
			});
			/* v8 ignore next 1 -- plugin mounts never carry an injected store; direct constructions never run init. */
			if (this.walletStore === void 0) {
				const domain = await this.ctx.storageDomain.open(x402WalletDomainSpec);
				this.ctx.effect(() => async () => {
					await domain.close();
				}, "x402.walletDomainClose");
				this.walletStore = new StorageWalletStore(domain);
				this.paymentsTable = domain.table("payments");
				this.restorePayments(this.paymentsTable);
				await this.seedLegacyWallet();
			}
		}
		/** The durable wallet registry; unavailable only before init in direct constructions. */
		requireWalletStore() {
			if (this.walletStore === void 0) throw new X402Error("wallet-not-configured", "x402 wallet store is not initialized");
			return this.walletStore;
		}
		/** The selected wallet, or a loud refusal when none exists. */
		async requireCurrentWallet() {
			const current = await this.requireWalletStore().current();
			if (current === void 0) throw new X402Error("wallet-not-configured", "No wallet yet — create one in the wallet panel first.");
			return current;
		}
		/** Resolve the current wallet's key per operation; a blank or missing value means unconfigured. */
		async resolveCurrentKey() {
			const store = this.walletStore;
			if (store !== void 0) {
				const current = await store.current();
				if (current !== void 0) return (await this.ctx.credentials.resolve(credentialRef(current.keyRef)))?.value;
			}
			return (await this.ctx.credentials.resolve(credentialRef(this.config.keyRef)))?.value;
		}
		/** Seed a wallet from the legacy single-key credential so existing setups keep working. */
		async seedLegacyWallet() {
			const store = this.walletStore;
			/* v8 ignore next 1 -- init assigns the store before seeding; the guard is defensive. */
			if (store === void 0) return;
			if ((await store.list()).length > 0) return;
			const hit = await this.ctx.credentials.resolve(credentialRef(this.config.keyRef));
			if (hit === void 0 || hit.value.trim().length === 0) return;
			const address = privateKeyToAccount(hit.value.trim()).address;
			const wallet = {
				id: mintWalletId(),
				label: "Default wallet",
				address,
				keyRef: this.config.keyRef,
				createdAt: Date.now()
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
			if (!response.ok) throw new Error(`x402 catalog unreachable: HTTP ${response.status}`);
			const catalog = await response.json();
			const needle = keyword?.toLowerCase();
			return (catalog.services ?? []).filter((entry) => entry.live !== false).filter((entry) => network === void 0 || entry.network === network).filter((entry) => needle === void 0 || entry.resource.toLowerCase().includes(needle) || (entry.description ?? "").toLowerCase().includes(needle)).slice(0, 25).map((entry) => ({
				resource: entry.resource,
				description: entry.description ?? "",
				network: entry.network ?? this.config.network,
				priceUsdc: entry.price_usdc ?? "",
				scheme: entry.scheme ?? "exact",
				x402Version: entry.x402_version ?? 2,
				live: entry.live !== false
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
				method: method ?? "GET",
				headers: { accept: "application/json" }
			});
			if (probe.requirement === void 0) return {
				requiresPayment: false,
				status: probe.status
			};
			return {
				requiresPayment: true,
				requirement: probe.requirement
			};
		}
		/**
		* Read the wallet snapshot: configured status, address, and USDC balance.
		* @returns wallet state; balance RPC failures surface loud.
		*/
		async wallet() {
			const current = this.walletStore === void 0 ? void 0 : await this.walletStore.current();
			const key = await this.resolveCurrentKey();
			if (key === void 0 || key.trim().length === 0) return {
				configured: false,
				network: this.config.network
			};
			const address = await this.protocol.address();
			return {
				configured: true,
				address,
				usdcBalance: await this.protocol.balance(address),
				network: this.config.network,
				...current === void 0 ? {} : {
					label: current.label,
					walletId: current.id
				}
			};
		}
		/**
		* List every wallet in the registry, marking the selected one.
		* @returns wallet records with the current selection flagged.
		*/
		async wallets() {
			const store = this.requireWalletStore();
			const current = await store.current();
			return (await store.list()).map((wallet) => walletRecord(wallet, current?.id === wallet.id));
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
			if (label.length === 0) throw new X402Error("invalid-wallet", "Wallet label must not be empty.");
			const id = mintWalletId();
			const keyRef = keyRefOf(id);
			const privateKey = request.privateKey?.trim();
			let key;
			if (privateKey === void 0 || privateKey.length === 0) key = generatePrivateKey();
			else {
				try {
					privateKeyToAccount(privateKey);
				} catch {
					throw new X402Error("invalid-wallet", "The imported private key is invalid.");
				}
				key = privateKey;
			}
			await this.ctx.credentials.set(credentialRef(keyRef), key);
			const wallet = {
				id,
				label,
				address: privateKeyToAccount(key).address,
				keyRef,
				createdAt: Date.now()
			};
			await store.create(wallet);
			if (await store.current() === void 0) await store.setCurrent(id);
			return walletRecord(wallet, (await store.current())?.id === id);
		}
		/**
		* Make one wallet the selection used by payments and transfers.
		* @param id - durable wallet id from `wallets()`.
		* @returns confirmation once the selection is durably written.
		*/
		async selectWallet(id) {
			const store = this.requireWalletStore();
			if (await store.get(id) === void 0) throw new X402Error("wallet-not-found", `x402: unknown wallet ${id}`);
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
			if (!isAddress(to)) throw new X402Error("invalid-wallet", `Invalid recipient address "${request.to}".`);
			const { transaction } = await this.protocol.send(to, request.amountUsdc);
			return {
				transaction,
				to,
				amountUsdc: request.amountUsdc,
				status: "confirmed"
			};
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
				method: request.method ?? "GET",
				...request.headers === void 0 ? {} : { headers: request.headers },
				...request.body === void 0 ? {} : { body: JSON.stringify(request.body) }
			};
			let paidAmount = "0.000000";
			const receipt = await this.protocol.pay(request.url, init, cap, async (requirement) => {
				paidAmount = requirement.amountUsdc;
				if (!this.config.approvalRequired) return;
				const outcome = await this.ctx.approval.request({
					agent: request.agent,
					toolName: "x402_pay",
					...request.callId === void 0 ? {} : { callId: request.callId },
					reason: `x402 pay ${requirement.amountUsdc} USDC to ${requirement.payTo} for ${requirement.resource}`,
					...request.signal === void 0 ? {} : { signal: request.signal }
				});
				if (outcome === "rejected" || outcome === "cancelled") throw new X402Error("rejected", "The x402 payment was rejected; nothing was charged.");
				if (outcome === "unavailable") throw new X402Error("rejected", "No approval responder is available; the x402 payment was safely rejected.");
			});
			if (receipt.paymentStatus === "settled" || receipt.paymentStatus === "settle_failed") await this.record({
				url: request.url,
				amountUsdc: paidAmount,
				...receipt.transaction === void 0 ? {} : { transaction: receipt.transaction },
				status: receipt.paymentStatus === "settled" ? "settled" : "failed"
			});
			return receipt;
		}
		/** Reload the durable payment ring from the domain; the ring stays capped at the newest records. */
		restorePayments(table) {
			const rows = [...table.entries()].map(([, record]) => record).sort((a, b) => a.time - b.time);
			this.records.push(...rows.slice(-100));
			const ids = rows.map((record) => Number(record.id.replace(/^x402-/, ""))).filter(Number.isFinite);
			if (ids.length > 0) this.nextRecord = Math.max(...ids) + 1;
		}
		/** Append one payment to the ring, persist it, and broadcast it to the GUI. */
		async record(entry) {
			const record = {
				...entry,
				id: `x402-${this.nextRecord++}`,
				network: this.config.network,
				time: Date.now()
			};
			this.records.push(record);
			const evicted = this.records.length > MAX_RECORDS ? this.records.shift() : void 0;
			const table = this.paymentsTable;
			if (table !== void 0) try {
				await table.put(record.id, record);
				/* v8 ignore next 2 -- eviction with a live table needs 101 real paid calls; the in-memory depth cap covers the shift logic. */
				if (evicted !== void 0) await table.delete(evicted.id);
			} catch {}
			this.ctx.emit("x402/payment", record);
		}
	};
})();
//#endregion
export { X402Error, X402Service, X402Service as default, X402_SYSTEM_PROMPT, createX402Protocol, formatUsdc, parseUsdcAmount };
