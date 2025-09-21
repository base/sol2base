import { PublicKey } from '@solana/web3.js';

// Base Sepolia (testnet) configuration
export const BASE_SEPOLIA_CONFIG = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  
  // Contract addresses from the bridge deployment
  bridge: '0x5961B1579913632c91c8cdC771cF48251A4B54F0',
  bridgeValidator: '0xc317307EfC64e39B1ec2ADAf507a64f8276263cF',
  crossChainERC20Factory: '0xeeD08a362fc4254864Dce24F7b5dDAD4efaC07d3',
  twin: '0xB2043e842f6C11c21cF2A3F5bb5Fe3f892F1f5B8',
  relayerOrchestrator: '0x73f76f6385855B52Fd10D320191100278110E3D8',
  
  // Token addresses
  wrappedSOL: '0x70445da14e089424E5f7Ab6d3C22F5Fadeb619Ca',
  wrappedSPL: '0x4752285a93F5d0756bB2D6ed013b40ea8527a8DA',
  erc20: '0x62C1332822983B8412A6Ffda0fd77cd7d5733Ee9', // Test USDC
};

// Solana Devnet configuration
export const SOLANA_DEVNET_CONFIG = {
  name: 'Solana Devnet',
  rpcUrl: 'https://api.devnet.solana.com',
  blockExplorer: 'https://explorer.solana.com',
  
  // Program addresses from the bridge deployment
  solanaBridge: new PublicKey('83hN2esneZUbKgLfUvo7uzas4g7kyiodeNKAqZgx5MbH'),
  baseRelayerProgram: new PublicKey('J29jxzRsQmkpxkJptuaxYXgyNqjFZErxXtDWQ4ma3k51'),
  
  // Token addresses
  cdpUsdc: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // CDP USDC on Solana Devnet
  bridgeUsdc: new PublicKey('8KkQRERXdASmXqeWw7sPFB56wLxyHMKc9NPDW64EEL31'), // Bridge USDC (expected by bridge contracts)
  spl: new PublicKey('8KkQRERXdASmXqeWw7sPFB56wLxyHMKc9NPDW64EEL31'), // Default to bridge USDC for bridge operations
  wEth: new PublicKey('DG4ncVRoiSkYBLVUXxCFbVg38RhByjFKTLZi6UFFmZuf'),
  wErc20: new PublicKey('44PhEvftJp57KRNSR7ypGLns1JUKXqAubewi3h5q1TEo'),
};

// Bridge configuration
export const BRIDGE_CONFIG = {
  // Minimum amounts for bridging (in lamports) - removed minimum for SOL
  minBridgeAmount: 0, // No minimum for SOL bridging
  
  // Gas estimates
  estimatedGasLimit: 200000,
  
  // Confirmation requirements
  requiredConfirmations: 12, // Base blocks
  
  // Timeout for bridge operations (in milliseconds)
  bridgeTimeout: 5 * 60 * 1000, // 5 minutes (reduced from 15 - need to verify actual time)
};

// UI Constants
export const UI_CONFIG = {
  maxDecimals: 9, // For SOL (9 decimals)
  defaultSlippage: 0.5, // 0.5%
  refreshInterval: 10000, // 10 seconds
};
