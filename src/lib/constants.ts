import { PublicKey } from '@solana/web3.js';

export const PROJECT_NAME = "Terminally Onchain";
export const PROJECT_TAGLINE = "call any contract on base from your solana wallet";

export type BridgeAssetKind = 'sol' | 'spl';
export type BridgeEnvironment = 'devnet' | 'mainnet';

export interface BridgeAssetConfig {
  symbol: string;
  label: string;
  type: BridgeAssetKind;
  decimals: number;
  mintAddress?: string;
  remoteAddress?: string;
  description: string;
}

export interface SolanaClusterConfig {
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  explorerTxSuffix?: string;
  explorerAddressSuffix?: string;
  solanaBridge: PublicKey;
  baseRelayerProgram: PublicKey;
  gasFeeReceiver: PublicKey;
  cdpUsdc?: PublicKey;
  bridgeUsdc?: PublicKey;
  spl?: PublicKey;
  wEth?: PublicKey;
  wErc20?: PublicKey;
}

export interface BaseNetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  bridge: string;
  bridgeValidator: string;
  crossChainFactory?: string;
  relayerOrchestrator?: string;
  wrappedSOL: string;
}

export interface BridgeEnvironmentConfig {
  id: BridgeEnvironment;
  label: string;
  description: string;
  solana: SolanaClusterConfig;
  base: BaseNetworkConfig;
  assets: BridgeAssetConfig[];
}

const DEVNET_REMOTE_WSOL =
  (process.env.NEXT_PUBLIC_BASE_SEPOLIA_WSOL ||
    "0xCace0c896714DaF7098FFD8CC54aFCFe0338b4BC").toLowerCase();
const MAINNET_REMOTE_WSOL =
  (process.env.NEXT_PUBLIC_BASE_MAINNET_WSOL ||
    "0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82").toLowerCase();

const MAINNET_GAS_RECEIVER =
  process.env.NEXT_PUBLIC_SOLANA_MAINNET_GAS_RECEIVER ||
  "AFs1LCbodhvwpgX3u3URLsud6R1XMSaMiQ5LtXw4GKYT";

if (!process.env.NEXT_PUBLIC_BASE_SEPOLIA_WSOL) {
  console.log("[terminally-onchain] using default Base Sepolia WSOL address");
}

if (!process.env.NEXT_PUBLIC_BASE_MAINNET_WSOL) {
  console.log("[terminally-onchain] using default Base Mainnet WSOL address");
}

if (!process.env.NEXT_PUBLIC_SOLANA_MAINNET_GAS_RECEIVER) {
  console.warn(
    "[terminally-onchain] NEXT_PUBLIC_SOLANA_MAINNET_GAS_RECEIVER not set, using devnet fallback for gas receiver"
  );
}

const DEVNET_SOLANA_CONFIG: SolanaClusterConfig = {
  name: "Solana Devnet",
  rpcUrl: "https://api.devnet.solana.com",
  blockExplorer: "https://explorer.solana.com",
  explorerTxSuffix: "?cluster=devnet",
  solanaBridge: new PublicKey("7c6mteAcTXaQ1MFBCrnuzoZVTTAEfZwa6wgy4bqX3KXC"),
  baseRelayerProgram: new PublicKey("56MBBEYAtQAdjT4e1NzHD8XaoyRSTvfgbSVVcEcHj51H"),
  gasFeeReceiver: new PublicKey("AFs1LCbodhvwpgX3u3URLsud6R1XMSaMiQ5LtXw4GKYT"),
  cdpUsdc: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
  bridgeUsdc: new PublicKey("8KkQRERXdASmXqeWw7sPFB56wLxyHMKc9NPDW64EEL31"),
  spl: new PublicKey("8KkQRERXdASmXqeWw7sPFB56wLxyHMKc9NPDW64EEL31"),
  wEth: new PublicKey("DG4ncVRoiSkYBLVUXxCFbVg38RhByjFKTLZi6UFFmZuf"),
  wErc20: new PublicKey("44PhEvftJp57KRNSR7ypGLns1JUKXqAubewi3h5q1TEo"),
};

const MAINNET_SOLANA_CONFIG: SolanaClusterConfig = {
  name: "Solana Mainnet",
  rpcUrl: "https://api.mainnet-beta.solana.com",
  blockExplorer: "https://explorer.solana.com",
  solanaBridge: new PublicKey("HNCne2FkVaNghhjKXapxJzPaBvAKDG1Ge3gqhZyfVWLM"),
  baseRelayerProgram: new PublicKey("g1et5VenhfJHJwsdJsDbxWZuotD5H4iELNG61kS4fb9"),
  gasFeeReceiver: new PublicKey(MAINNET_GAS_RECEIVER),
};

const DEVNET_BASE_CONFIG: BaseNetworkConfig = {
  chainId: 84532,
  name: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  blockExplorer: "https://sepolia.basescan.org",
  bridge: "0x01824a90d32a69022ddaecc6c5c14ed08db4eb9b",
  bridgeValidator: "0xa80c07df38fb1a5b3e6a4f4faab71e7a056a4ec7",
  wrappedSOL: DEVNET_REMOTE_WSOL,
};

const MAINNET_BASE_CONFIG: BaseNetworkConfig = {
  chainId: 8453,
  name: "Base Mainnet",
  rpcUrl: "https://mainnet.base.org",
  blockExplorer: "https://basescan.org",
  bridge: "0x3eff766c76a1be2ce1acff2b69c78bcae257d5188",
  bridgeValidator: "0xaf24c1c24ff3bf1e6d882518120fc25442d6794b",
  crossChainFactory: "0xdd56781d0509650f8c2981231b6c917f2d5d7df2",
  relayerOrchestrator: "0x8cfa6f29930e6310b6074bab0052c14a709b4741",
  wrappedSOL: MAINNET_REMOTE_WSOL,
};

const DEVNET_ASSETS: BridgeAssetConfig[] = [
  {
    symbol: "sol",
    label: "Native SOL",
    type: "sol",
    decimals: 9,
    remoteAddress: DEVNET_BASE_CONFIG.wrappedSOL,
    description: PROJECT_TAGLINE,
  },
  {
    symbol: "usdc",
    label: "Bridge USDC",
    type: "spl",
    decimals: 6,
    mintAddress: DEVNET_SOLANA_CONFIG.bridgeUsdc?.toBase58(),
    remoteAddress: process.env.NEXT_PUBLIC_BASE_USDC?.toLowerCase(),
    description: PROJECT_TAGLINE,
  },
];

const MAINNET_ASSETS: BridgeAssetConfig[] = [
  {
    symbol: "sol",
    label: "Native SOL",
    type: "sol",
    decimals: 9,
    remoteAddress: MAINNET_BASE_CONFIG.wrappedSOL,
    description: PROJECT_TAGLINE,
  },
];

export const NETWORK_PRESETS: Record<BridgeEnvironment, BridgeEnvironmentConfig> = {
  devnet: {
    id: "devnet",
    label: "Solana Devnet → Base Sepolia",
    description: PROJECT_TAGLINE,
    solana: DEVNET_SOLANA_CONFIG,
    base: DEVNET_BASE_CONFIG,
    assets: DEVNET_ASSETS,
  },
  mainnet: {
    id: "mainnet",
    label: "Solana Mainnet → Base Mainnet",
    description: PROJECT_TAGLINE,
    solana: MAINNET_SOLANA_CONFIG,
    base: MAINNET_BASE_CONFIG,
    assets: MAINNET_ASSETS,
  },
};

export const DEFAULT_ENVIRONMENT: BridgeEnvironment = "devnet";

export const ENVIRONMENT_CHOICES = Object.values(NETWORK_PRESETS).map((preset) => ({
  id: preset.id,
  label: preset.label,
}));

export const getEnvironmentPreset = (
  env: BridgeEnvironment = DEFAULT_ENVIRONMENT
): BridgeEnvironmentConfig => NETWORK_PRESETS[env];

// Standard gas limit for bridge operations
export const DEFAULT_GAS_LIMIT = BigInt(process.env.NEXT_PUBLIC_GAS_LIMIT ?? "200000");

// Bridge configuration
export const BRIDGE_CONFIG = {
  minBridgeAmount: 0,
  estimatedGasLimit: 200000,
  requiredConfirmations: 12,
  bridgeTimeout: 5 * 60 * 1000,
};

// UI Constants
export const UI_CONFIG = {
  maxDecimals: 9,
  defaultSlippage: 0.5,
  refreshInterval: 10000,
};
