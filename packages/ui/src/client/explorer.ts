/** Block-explorer URL mapping for on-chain transaction links in the popup. */

/** Known CAIP-2 networks → explorer base URL. */
const EXPLORERS: Readonly<Record<string, string>> = {
  'eip155:8453': 'https://basescan.org',
  'eip155:84532': 'https://sepolia.basescan.org',
  'eip155:1': 'https://etherscan.io',
  'eip155:11155111': 'https://sepolia.etherscan.io',
  'eip155:10': 'https://optimistic.etherscan.io',
  'eip155:42161': 'https://arbiscan.io',
}

/** Known testnet faucets, keyed by CAIP-2 network. */
const FAUCETS: Readonly<Record<string, string>> = {
  'eip155:84532': 'https://www.coinbase.com/faucets/base-sepolia-faucet',
  'eip155:11155111': 'https://faucet.quicknode.com/ethereum/sepolia',
}

/**
 * The block-explorer transaction URL for one network, when the network is known.
 * @param network - CAIP-2 network identifier from the wallet snapshot.
 * @param hash - on-chain transaction hash.
 * @returns the explorer URL, or undefined for an unmapped network.
 */
export function explorerTxUrl(network: string, hash: string): string | undefined {
  const base = EXPLORERS[network]
  return base === undefined ? undefined : `${base}/tx/${hash}`
}

/**
 * A testnet faucet URL for one network, when the network has a known faucet.
 * @param network - CAIP-2 network identifier from the wallet snapshot.
 * @returns the faucet URL, or undefined for mainnets and unmapped networks.
 */
export function faucetUrl(network: string): string | undefined {
  return FAUCETS[network]
}
