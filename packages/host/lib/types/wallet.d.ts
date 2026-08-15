/**
 * Durable wallet registry: one row per wallet (public identity + credential
 * reference) in a storage domain; the private keys themselves live in the
 * credentials store. An in-memory store backs tests.
 * @module @deepseek-ai/dsh-x402/wallet
 */
import type { Address } from 'viem';
import type { Domain } from '@deepseek-ai/dsh-storage-domain';
import type { X402WalletRecord } from './types.ts';
/** One durable wallet row: public identity plus the credential reference of its key. */
export interface X402Wallet {
    /** Opaque durable identity. */
    id: string;
    /** User-chosen label. */
    label: string;
    /** Checksummed wallet address. */
    address: Address;
    /** Credential reference name holding the private key. */
    keyRef: string;
    /** Epoch milliseconds when the wallet was created. */
    createdAt: number;
}
/** Durable wallet registry domain; the JSON backend persists it under the DSH home. */
export declare const x402WalletDomainSpec: {
    name: string;
    version: number;
    tables: {
        wallets: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, X402Wallet>;
        meta: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, {
            currentId: string;
        }>;
    };
};
/** The durable wallet-registry surface the service and tests share. */
export interface X402WalletStore {
    /** List every wallet in creation order. */
    list(): Promise<X402Wallet[]>;
    /** Read one wallet by id. */
    get(id: string): Promise<X402Wallet | undefined>;
    /** Read the selected wallet, when one exists. */
    current(): Promise<X402Wallet | undefined>;
    /** Insert a new wallet. */
    create(wallet: X402Wallet): Promise<void>;
    /** Make one wallet the selection. */
    setCurrent(id: string): Promise<void>;
}
/** Storage-backed wallet store over one opened domain. */
export declare class StorageWalletStore implements X402WalletStore {
    private readonly wallets;
    private readonly meta;
    /**
     * @param domain - opened x402 wallet domain (owned by the service).
     */
    constructor(domain: Domain<typeof x402WalletDomainSpec>);
    list(): Promise<X402Wallet[]>;
    get(id: string): Promise<X402Wallet | undefined>;
    current(): Promise<X402Wallet | undefined>;
    create(wallet: X402Wallet): Promise<void>;
    setCurrent(id: string): Promise<void>;
}
/** Process-memory wallet store for tests and headless compositions without a storage backend. */
export declare class MemoryWalletStore implements X402WalletStore {
    private readonly rows;
    private currentId;
    list(): Promise<X402Wallet[]>;
    get(id: string): Promise<X402Wallet | undefined>;
    current(): Promise<X402Wallet | undefined>;
    create(wallet: X402Wallet): Promise<void>;
    setCurrent(id: string): Promise<void>;
}
/**
 * Mint a fresh durable wallet identity.
 * @returns a short random wallet id like `w-1a2b3c4d`.
 */
export declare function mintWalletId(): string;
/**
 * Mint the credential reference name for one wallet.
 * @param walletId - the durable wallet id.
 * @returns the credential reference under which the wallet key is stored.
 */
export declare function keyRefOf(walletId: string): string;
/**
 * Project one durable wallet row to its GUI record.
 * @param wallet - the durable wallet row.
 * @param isCurrent - whether this wallet is the selected one.
 * @returns the GUI-facing record.
 */
export declare function walletRecord(wallet: X402Wallet, isCurrent: boolean): X402WalletRecord;
//# sourceMappingURL=wallet.d.ts.map