/** Block-explorer URL mapping for on-chain transaction links in the popup. */
/** Known CAIP-2 networks → explorer base URL. */
const EXPLORERS = {
    'eip155:8453': 'https://basescan.org',
    'eip155:84532': 'https://sepolia.basescan.org',
    'eip155:1': 'https://etherscan.io',
    'eip155:11155111': 'https://sepolia.etherscan.io',
    'eip155:10': 'https://optimistic.etherscan.io',
    'eip155:42161': 'https://arbiscan.io',
};
/**
 * The block-explorer transaction URL for one network, when the network is known.
 * @param network - CAIP-2 network identifier from the wallet snapshot.
 * @param hash - on-chain transaction hash.
 * @returns the explorer URL, or undefined for an unmapped network.
 */
export function explorerTxUrl(network, hash) {
    const base = EXPLORERS[network];
    return base === undefined ? undefined : `${base}/tx/${hash}`;
}
//# sourceMappingURL=explorer.js.map