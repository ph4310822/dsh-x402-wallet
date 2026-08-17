/**
 * Native x402 protocol client: probe a 402 challenge, enforce a spending cap,
 * sign a payment authorization with the wallet key, retry with the proof, and
 * parse the settlement. All network access goes through an injected fetch so
 * unit tests run without sockets.
 * @module @deepseek-ai/dsh-x402/protocol
 */
import { x402Client, x402HTTPClient } from '@x402/core/client';
import { ExactEvmScheme, getDefaultAsset } from '@x402/evm';
import { createPublicClient, createWalletClient, custom, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
/** One protocol failure with a stable code and a model-facing message. */
export class X402Error extends Error {
    code;
    name = 'X402Error';
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
const BALANCE_OF_ABI = [{
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    }];
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
    }];
/** ERC-20 Transfer event for on-chain history reads. */
const TRANSFER_EVENT = {
    name: 'Transfer',
    type: 'event',
    inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256' },
    ],
};
/** Default on-chain history window in blocks; public RPCs cap `eth_getLogs` around 10,000. */
export const DEFAULT_HISTORY_BLOCK_RANGE = 10000n;
/**
 * Parse a human USDC amount into the token's smallest unit.
 * @param amountUsdc - decimal string, e.g. `1.25`.
 * @param decimals - token decimals (6 for USDC).
 * @returns the raw amount; throws `invalid-amount` on malformed input.
 */
export function parseUsdcAmount(amountUsdc, decimals) {
    const match = /^(\d+)(?:\.(\d+))?$/.exec(amountUsdc.trim());
    if (match === null)
        throw new X402Error('invalid-amount', `invalid USDC amount "${amountUsdc}" — use a plain decimal like 1.25`);
    /* v8 ignore next 1 -- the regex guarantees a whole part; the fallback is defensive. */
    const whole = BigInt(match[1] ?? '0');
    const fraction = (match[2] ?? '').padEnd(decimals, '0').slice(0, decimals);
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
    return custom({
        request: async ({ method, params }) => {
            /* v8 ignore next 3 -- viem always supplies params for readContract calls; the fallback is defensive. */
            const rpcBody = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: (params ?? []) });
            const response = await fetchImpl(rpcUrl, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: rpcBody,
            });
            const json = await response.json();
            if (json.error !== undefined) {
                throw new Error(`x402 RPC ${method} failed: ${json.error.message ?? 'unknown error'}`);
            }
            return json.result;
        },
    });
}
/**
 * Format a raw token amount as a fixed-decimal USDC string.
 * @param raw - amount in the token's smallest unit.
 * @param decimals - token decimals (6 for USDC).
 * @returns a six-fraction-digit USDC string.
 */
export function formatUsdc(raw, decimals) {
    const value = BigInt(raw);
    const scale = 10n ** BigInt(decimals);
    const whole = value / scale;
    const fraction = value % scale;
    return `${whole}.${fraction.toString().padStart(decimals, '0').slice(0, 6)}`;
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
    }
    catch {
        return undefined;
    }
}
/**
 * Create the payment protocol bound to one network and one credential source.
 * @param deps - network, RPC endpoint, and the per-operation key resolver.
 * @returns the protocol surface the service and tests share.
 */
export function createX402Protocol(deps) {
    // getDefaultAsset fails loud for an unknown network at construction time.
    const asset = getDefaultAsset(deps.network);
    const decimals = asset.decimals;
    const client = new x402Client();
    const http = new x402HTTPClient(client);
    let account;
    let publicClient;
    /** Build the public client over the injected RPC transport. */
    function makePublic() {
        return createPublicClient({ chain: base, transport: createRpcTransport(deps.fetch, deps.rpcUrl) });
    }
    /** The cached public client. */
    function thisPublic() {
        publicClient ??= makePublic();
        return publicClient;
    }
    /** Resolve the signing account from the current wallet key, re-registering the scheme on switch. */
    async function requireAccount() {
        const key = await deps.resolveKey();
        if (key === undefined || key.trim().length === 0) {
            throw new X402Error('wallet-not-configured', 'x402 wallet is not configured. Set the X402_PRIVATE_KEY credential (a dedicated spending wallet, not your main wallet) '
                + 'through the credentials store or environment, then retry.');
        }
        const next = privateKeyToAccount(key.trim());
        if (account === undefined || account.address !== next.address) {
            account = next;
            client.register(deps.network, new ExactEvmScheme(account));
        }
        return account;
    }
    /** Pick the one accepted requirement this wallet can pay, or fail loud. */
    function selectRequirement(required) {
        if (required.x402Version !== 2) {
            throw new X402Error('version-unsupported', `this server speaks x402 v${required.x402Version}; the plugin pays x402 v2. `);
        }
        const matches = required.accepts.filter(accepts => accepts.network === deps.network);
        if (matches.length === 0) {
            const offered = [...new Set(required.accepts.map(accepts => accepts.network))].join(', ');
            throw new X402Error('network-unsupported', `server accepts payment on ${offered}; the wallet is configured for ${deps.network}.`);
        }
        const chosen = matches[0];
        /* v8 ignore next 3 -- the length check above guarantees a first element; TS cannot narrow indexing. */
        if (chosen === undefined)
            throw new X402Error('network-unsupported', 'server accepted no payable requirement.');
        if (chosen.asset.toLowerCase() !== asset.address.toLowerCase()) {
            throw new X402Error('asset-unsupported', `server wants asset ${chosen.asset}; the wallet pays the ${deps.network} default ${asset.address}.`);
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
        };
    }
    /** Abort before signing when the requirement exceeds the caller's cap. */
    function enforceCap(requirement, capUsdc) {
        const capRaw = BigInt(Math.round(capUsdc * 10 ** decimals));
        if (BigInt(requirement.amountRaw) > capRaw) {
            throw new X402Error('cap-exceeded', `this call costs ${requirement.amountUsdc} USDC, above the ${capUsdc.toFixed(6)} USDC cap. `
                + 'Nothing was paid. Raise maxCostUsdc only if the user explicitly agrees.');
        }
    }
    return {
        async estimate(url, init) {
            const response = await deps.fetch(url, init);
            if (response.status !== 402)
                return { status: response.status };
            const body = await tryJson(response);
            const required = http.getPaymentRequiredResponse(name => response.headers.get(name), body);
            return { status: 402, requirement: selectRequirement(required) };
        },
        async pay(url, init, capUsdc, confirm) {
            const probe = await deps.fetch(url, init);
            if (probe.status !== 402) {
                const body = await tryJson(probe);
                return { url, status: probe.status, paymentStatus: 'none', body };
            }
            const body = await tryJson(probe);
            const required = http.getPaymentRequiredResponse(name => probe.headers.get(name), body);
            const requirement = selectRequirement(required);
            enforceCap(requirement, capUsdc);
            if (confirm !== undefined)
                await confirm(requirement);
            await requireAccount();
            const payload = await http.createPaymentPayload(required);
            const signatureHeaders = http.encodePaymentSignatureHeader(payload);
            const paid = await deps.fetch(url, {
                ...init,
                headers: { ...init.headers, ...signatureHeaders },
            });
            const parsed = await http.processResponse(paid);
            const settle = parsed.header !== undefined && 'transaction' in parsed.header ? parsed.header : undefined;
            return {
                url,
                status: parsed.status,
                paymentStatus: parsed.paymentStatus,
                body: parsed.body,
                ...(settle?.transaction === undefined ? {} : { transaction: settle.transaction }),
                ...(settle?.payer === undefined ? {} : { payer: settle.payer }),
            };
        },
        async address() {
            return (await requireAccount()).address;
        },
        async balance(address) {
            const raw = await thisPublic().readContract({
                address: asset.address,
                abi: BALANCE_OF_ABI,
                functionName: 'balanceOf',
                args: [address],
            });
            return formatUsdc(raw.toString(), decimals);
        },
        async send(to, amountUsdc) {
            const account = await requireAccount();
            const amount = parseUsdcAmount(amountUsdc, decimals);
            if (amount <= 0n)
                throw new X402Error('invalid-amount', 'USDC amount must be positive');
            const publicClient = thisPublic();
            const held = await publicClient.readContract({
                address: asset.address,
                abi: BALANCE_OF_ABI,
                functionName: 'balanceOf',
                args: [account.address],
            });
            if (held < amount) {
                throw new X402Error('insufficient-balance', `insufficient USDC: wallet holds ${formatUsdc(held.toString(), decimals)}, requested ${amountUsdc}`);
            }
            const data = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [to, amount],
            });
            let gas;
            try {
                gas = await publicClient.estimateGas({ account: account.address, to: asset.address, data });
            }
            catch (error) {
                throw new X402Error('transfer-failed', `transfer estimate failed: ${errorMessage(error)}`);
            }
            const walletClient = createWalletClient({ account, chain: base, transport: createRpcTransport(deps.fetch, deps.rpcUrl) });
            let transaction;
            try {
                transaction = await walletClient.sendTransaction({ to: asset.address, data, gas });
            }
            catch (error) {
                throw new X402Error('transfer-failed', `transfer broadcast failed: ${errorMessage(error)}`);
            }
            /* v8 ignore next 3 -- viem resolves on status-0x0 receipts; only timeout/transport rejects here. */
            await publicClient.waitForTransactionReceipt({ hash: transaction }).catch(() => {
                throw new X402Error('transfer-failed', 'transfer confirmed but receipt read failed');
            });
            return { transaction };
        },
        async history(address, limit = 50) {
            const publicClient = thisPublic();
            const toBlock = await publicClient.getBlockNumber();
            const fromBlock = toBlock - (deps.historyBlockRange ?? DEFAULT_HISTORY_BLOCK_RANGE);
            const [outLogs, inLogs] = await Promise.all([
                publicClient.getLogs({ address: asset.address, event: TRANSFER_EVENT, args: { from: address }, fromBlock, toBlock }),
                publicClient.getLogs({ address: asset.address, event: TRANSFER_EVENT, args: { to: address }, fromBlock, toBlock }),
            ]);
            const entries = [
                ...outLogs.map(log => ({ log, direction: 'out' })),
                ...inLogs.map(log => ({ log, direction: 'in' })),
            ].flatMap(({ log, direction }) => {
                if (log.args.from === undefined || log.args.to === undefined || log.args.value === undefined)
                    return [];
                return [{
                        hash: log.transactionHash,
                        from: log.args.from,
                        to: log.args.to,
                        value: log.args.value,
                        blockNumber: Number(log.blockNumber),
                        direction,
                    }];
            });
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
            }));
        },
    };
}
//# sourceMappingURL=protocol.js.map