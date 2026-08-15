/**
 * Durable wallet registry: one row per wallet (public identity + credential
 * reference) in a storage domain; the private keys themselves live in the
 * credentials store. An in-memory store backs tests.
 * @module @deepseek-ai/dsh-x402/wallet
 */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
const x402WalletSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    address: z.string().startsWith('0x'),
    keyRef: z.string().min(1),
    createdAt: z.number().int().nonnegative(),
});
/** Durable wallet registry domain; the JSON backend persists it under the DSH home. */
export const x402WalletDomainSpec = defineDomain({
    name: 'x402_wallet',
    version: 0,
    tables: {
        wallets: domainTable(x402WalletSchema),
        meta: domainTable(z.object({ currentId: z.string().min(1) })),
    },
});
/** The current-selection meta row key. */
const CURRENT_KEY = 'current';
/** Storage-backed wallet store over one opened domain. */
export class StorageWalletStore {
    wallets;
    meta;
    /**
     * @param domain - opened x402 wallet domain (owned by the service).
     */
    constructor(domain) {
        this.wallets = domain.table('wallets');
        this.meta = domain.table('meta');
    }
    list() {
        return Promise.resolve([...this.wallets.entries()].map(([, wallet]) => wallet).sort((a, b) => a.createdAt - b.createdAt));
    }
    get(id) {
        return Promise.resolve(this.wallets.get(id));
    }
    current() {
        const meta = this.meta.get(CURRENT_KEY);
        return Promise.resolve(meta === undefined ? undefined : this.wallets.get(meta.currentId));
    }
    async create(wallet) {
        await this.wallets.put(wallet.id, wallet);
    }
    async setCurrent(id) {
        await this.meta.put(CURRENT_KEY, { currentId: id });
    }
}
/** Process-memory wallet store for tests and headless compositions without a storage backend. */
export class MemoryWalletStore {
    rows = new Map();
    currentId;
    list() {
        return Promise.resolve([...this.rows.values()].sort((a, b) => a.createdAt - b.createdAt));
    }
    get(id) {
        return Promise.resolve(this.rows.get(id));
    }
    current() {
        if (this.currentId === undefined)
            return Promise.resolve(undefined);
        return Promise.resolve(this.rows.get(this.currentId));
    }
    create(wallet) {
        this.rows.set(wallet.id, wallet);
        return Promise.resolve();
    }
    setCurrent(id) {
        if (!this.rows.has(id))
            return Promise.reject(new Error(`x402: cannot select unknown wallet ${id}`));
        this.currentId = id;
        return Promise.resolve();
    }
}
/**
 * Mint a fresh durable wallet identity.
 * @returns a short random wallet id like `w-1a2b3c4d`.
 */
export function mintWalletId() {
    return `w-${randomUUID().slice(0, 8)}`;
}
/**
 * Mint the credential reference name for one wallet.
 * @param walletId - the durable wallet id.
 * @returns the credential reference under which the wallet key is stored.
 */
export function keyRefOf(walletId) {
    return `X402_WALLET_${walletId.replace(/[^A-Z0-9_]/gi, '').toUpperCase()}`;
}
/**
 * Project one durable wallet row to its GUI record.
 * @param wallet - the durable wallet row.
 * @param isCurrent - whether this wallet is the selected one.
 * @returns the GUI-facing record.
 */
export function walletRecord(wallet, isCurrent) {
    return { id: wallet.id, label: wallet.label, address: wallet.address, isCurrent };
}
//# sourceMappingURL=wallet.js.map