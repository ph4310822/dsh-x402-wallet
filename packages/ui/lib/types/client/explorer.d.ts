/** Block-explorer URL mapping for on-chain transaction links in the popup. */
/**
 * The block-explorer transaction URL for one network, when the network is known.
 * @param network - CAIP-2 network identifier from the wallet snapshot.
 * @param hash - on-chain transaction hash.
 * @returns the explorer URL, or undefined for an unmapped network.
 */
export declare function explorerTxUrl(network: string, hash: string): string | undefined;
/**
 * A testnet faucet URL for one network, when the network has a known faucet.
 * @param network - CAIP-2 network identifier from the wallet snapshot.
 * @returns the faucet URL, or undefined for mainnets and unmapped networks.
 */
export declare function faucetUrl(network: string): string | undefined;
//# sourceMappingURL=explorer.d.ts.map