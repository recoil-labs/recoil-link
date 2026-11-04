import type { Address } from 'viem';

export interface ExplorerChain {
  /** Registry name. */
  name: string;
  displayName: string;
  /** Recoil Link domain id; equals the chain id on every supported EVM chain. */
  domain: number;
  /**
   * Tried in order. The first must answer eth_getLogs over `logRange` blocks:
   * sepolia.base.org refuses log queries (HTTP 413), and publicnode's OP Sepolia
   * nodes sometimes prune logs a few hours old.
   */
  rpcs: string[];
  mailbox: Address;
  /** Interchain gas paymaster: only its GasPayment events count. */
  igp: Address;
  /** Native token, which pays message fees. */
  nativeSymbol: string;
  /** Block explorer base URL, for transaction links. */
  blockExplorer: string;
  /** Seconds per block, measured. Converts time windows into block ranges. */
  blockTime: number;
  /** Largest block range one eth_getLogs call may cover on the first RPC. */
  logRange: bigint;
}

// Addresses: https://github.com/recoil-labs/recoil-link-registry
export const CHAINS: ExplorerChain[] = [
  {
    name: 'sepolia',
    displayName: 'Sepolia',
    nativeSymbol: 'ETH',
    domain: 11155111,
    rpcs: [
      'https://ethereum-sepolia.publicnode.com',
      'https://gateway.tenderly.co/public/sepolia',
    ],
    mailbox: '0xA066332EF9C28158BDCf45D1a6138219e86CB6c6',
    igp: '0x5d7A0bD0a19f6e104d74EBcB660218D0DfA43Cc3',
    blockExplorer: 'https://sepolia.etherscan.io',
    blockTime: 12,
    logRange: 5000n,
  },
  {
    name: 'basesepolia',
    displayName: 'Base Sepolia',
    nativeSymbol: 'ETH',
    domain: 84532,
    rpcs: [
      'https://base-sepolia-rpc.publicnode.com',
      'https://sepolia.base.org',
    ],
    mailbox: '0x078fba178e69c61cce09Fd7f1AE2f413B6c65c20',
    igp: '0x0d267364B1C197A158B5B37Ec370405c4fc90eb9',
    blockExplorer: 'https://sepolia.basescan.org',
    blockTime: 0.2,
    logRange: 50000n,
  },
  {
    name: 'optimismsepolia',
    displayName: 'OP Sepolia',
    nativeSymbol: 'ETH',
    domain: 11155420,
    rpcs: [
      'https://sepolia.optimism.io',
      'https://optimism-sepolia-rpc.publicnode.com',
    ],
    mailbox: '0x0B10f22CDF275293f7B4a995699440B04799c3bC',
    igp: '0x7f3450D5f8Dc984ba38e3Cb8DAD31e2a3Ecd8893',
    blockExplorer: 'https://sepolia-optimism.etherscan.io',
    blockTime: 2,
    logRange: 50000n,
  },
  {
    name: 'bsctestnet',
    displayName: 'BSC testnet',
    nativeSymbol: 'BNB',
    domain: 97,
    rpcs: [
      'https://bsc-testnet.publicnode.com',
      'https://bsc-testnet.drpc.org',
    ],
    mailbox: '0x7f3450D5f8Dc984ba38e3Cb8DAD31e2a3Ecd8893',
    igp: '0x8d823A965F44379819230F056DDF95b59f4960dc',
    blockExplorer: 'https://testnet.bscscan.com',
    blockTime: 0.45,
    logRange: 50000n,
  },
];

export function chainByDomain(domain: number): ExplorerChain | undefined {
  return CHAINS.find((c) => c.domain === domain);
}

/** About how many blocks `seconds` spans on `chain`. */
export function blocksIn(chain: ExplorerChain, seconds: number): bigint {
  return BigInt(Math.ceil(seconds / chain.blockTime));
}

export function txUrl(chain: ExplorerChain, hash: string): string {
  return `${chain.blockExplorer}/tx/${hash}`;
}
