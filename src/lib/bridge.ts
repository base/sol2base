import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { formatUnits, parseUnits } from 'ethers';
import {
  DEFAULT_ENVIRONMENT,
  getEnvironmentPreset,
  type BridgeAssetConfig,
  type BridgeEnvironment,
  type BridgeEnvironmentConfig,
} from './constants';
import { realBridgeImplementation } from './realBridgeImplementation';
import type { BaseContractCall, BridgeAssetDetails } from './realBridgeImplementation';

export interface BridgeTransfer {
  amount: number;
  destinationAddress: string;
  tokenAddress: string;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

export interface BridgeAssetOverrides {
  mint?: string;
  remote?: string;
  decimals?: number;
}

export interface BridgeExecutionOptions {
  walletAddress: PublicKey;
  amount: string;
  assetSymbol: string;
  destinationAddress: string;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  overrides?: BridgeAssetOverrides;
  callOptions?: BaseContractCall;
}

interface SplBalanceCheckResult {
  tokenAccount: PublicKey;
}

export class SolanaBridge {
  private connection: Connection;
  private environmentKey: BridgeEnvironment;
  private environmentConfig: BridgeEnvironmentConfig;

  constructor() {
    this.environmentKey = DEFAULT_ENVIRONMENT;
    this.environmentConfig = getEnvironmentPreset(this.environmentKey);
    this.connection = new Connection(this.environmentConfig.solana.rpcUrl, 'confirmed');
    realBridgeImplementation.setSolanaConfig(this.environmentConfig.solana);
  }

  getSupportedAssets(): BridgeAssetConfig[] {
    return this.environmentConfig.assets;
  }

  getEnvironment(): BridgeEnvironment {
    return this.environmentKey;
  }

  getEnvironmentConfig(): BridgeEnvironmentConfig {
    return this.environmentConfig;
  }

  getRpcConnection(): Connection {
    return this.connection;
  }

  setEnvironment(env: BridgeEnvironment) {
    if (env === this.environmentKey) {
      return;
    }
    this.environmentKey = env;
    this.environmentConfig = getEnvironmentPreset(env);
    this.connection = new Connection(this.environmentConfig.solana.rpcUrl, 'confirmed');
    realBridgeImplementation.setSolanaConfig(this.environmentConfig.solana);
  }

  /**
   * Get the balance of a specific SPL token for a wallet
   */
  async getTokenBalance(walletAddress: PublicKey, tokenMint: PublicKey): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(tokenMint, walletAddress);
      const account = await getAccount(this.connection, tokenAccount);
      return Number(account.amount) / Math.pow(10, 6); // USDC has 6 decimals
    } catch (error) {
      console.log('Token account not found or error getting balance:', error);
      return 0;
    }
  }

  /**
   * Get SOL balance for a wallet
   */
  async getSolBalance(walletAddress: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(walletAddress);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      return 0;
    }
  }

  /**
   * Request faucet tokens (uses mock faucet service)
   */
  async requestFaucetTokens(
    walletAddress: PublicKey,
    amount: number = 100
  ): Promise<string> {
    // Import the faucet service dynamically to avoid circular imports
    const { faucetService } = await import('./faucet');
    
    // Check eligibility first
    const eligibility = await faucetService.checkEligibility(walletAddress);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Not eligible for faucet tokens');
    }

    // Request tokens from faucet service
    const txHash = await faucetService.requestTokens(walletAddress, amount);
    return txHash;
  }

  /**
   * Legacy helper used by the original UI. Defaults to SOL bridging.
   */
  async createBridgeTransaction(
    walletAddress: PublicKey,
    amount: number,
    destinationAddress: string,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<string> {
    return this.bridge({
      walletAddress,
      amount: amount.toString(),
      assetSymbol: 'sol',
      destinationAddress,
      signTransaction,
    });
  }

  /**
   * Bridge any supported asset (SOL or SPL) to Base.
   */
  async bridge(options: BridgeExecutionOptions): Promise<string> {
    const {
      walletAddress,
      amount,
      assetSymbol,
      destinationAddress,
      signTransaction,
      overrides,
      callOptions,
    } = options;

    const trimmedAmount = amount.trim();
    if (!trimmedAmount) {
      throw new Error('Amount is required.');
    }

    const { addressResolver } = await import('./addressResolver');
    
    console.log(`Resolving destination address: ${destinationAddress}`);
    const resolvedAddress = await addressResolver.resolveAddress(destinationAddress);
    console.log(`Resolved to: ${resolvedAddress}`);

    const asset = await this.resolveAssetDefinition(assetSymbol, overrides);
    const amountInBaseUnits = this.parseAmountToUnits(trimmedAmount, asset.decimals);

    let tokenAccount: PublicKey | undefined;
    if (asset.type === 'sol') {
      await this.ensureSolBalance(walletAddress, amountInBaseUnits);
    } else {
      ({ tokenAccount } = await this.ensureSplBalance(walletAddress, asset, amountInBaseUnits));
    }

    const transaction = await realBridgeImplementation.createBridgeTransaction({
      walletAddress,
      amount: amountInBaseUnits,
      destinationAddress: resolvedAddress,
      asset,
      tokenAccount,
      call: callOptions,
    });

    const signature = await realBridgeImplementation.submitBridgeTransaction(
      transaction,
      walletAddress,
      signTransaction
    );

    console.log(`Bridge transaction submitted: ${signature}`);
    return signature;
  }

  private static readonly BASE58_MINT_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  private async resolveAssetDefinition(
    symbol: string,
    overrides?: BridgeAssetOverrides
  ): Promise<BridgeAssetDetails> {
    const rawSymbol = symbol.trim();
    const normalizedSymbol = rawSymbol.toLowerCase();
    const isMintAddress = SolanaBridge.BASE58_MINT_REGEX.test(rawSymbol);
    const base = this.environmentConfig.assets.find(asset => asset.symbol === normalizedSymbol);
    const forceSpl = isMintAddress || !!(overrides?.mint || overrides?.remote || overrides?.decimals);
    const type: 'sol' | 'spl' =
      forceSpl || base?.type === 'spl' || normalizedSymbol !== 'sol' ? 'spl' : 'sol';

    let mintAddress = overrides?.mint ?? base?.mintAddress;
    if (isMintAddress) {
      mintAddress = rawSymbol;
    }
    let remoteAddress = overrides?.remote ?? base?.remoteAddress;

    if (!remoteAddress) {
      throw new Error(
        `Remote Base token address is required for ${normalizedSymbol}. Provide --remote <0x...>.`
      );
    }

    remoteAddress = remoteAddress.toLowerCase();
    this.assertEvmAddress(remoteAddress, 'remote token');

    let decimals = overrides?.decimals ?? base?.decimals;
    let mint: PublicKey | undefined;

    if (type === 'spl') {
      if (!mintAddress) {
        throw new Error(
          `Mint address is required for ${normalizedSymbol}. Provide --mint <mintAddress>.`
        );
      }

      mint = new PublicKey(mintAddress);
      if (decimals === undefined) {
        const mintInfo = await getMint(this.connection, mint);
        decimals = mintInfo.decimals;
      }
    } else {
      decimals = decimals ?? 9;
      mint = undefined;
    }

    if (decimals === undefined) {
      throw new Error(
        `Unable to determine decimals for ${normalizedSymbol}. Provide --decimals <value>.`
      );
    }

    return {
      symbol: isMintAddress ? rawSymbol : normalizedSymbol,
      label: base?.label ?? normalizedSymbol.toUpperCase(),
      type,
      decimals,
      remoteAddress,
      mint,
      tokenProgram: TOKEN_PROGRAM_ID,
    };
  }

  private parseAmountToUnits(amount: string, decimals: number): bigint {
    try {
      const normalized = amount.trim();
      if (!normalized) {
        throw new Error('Amount must be greater than zero.');
      }
      const parsed = parseUnits(normalized, decimals);
      if (parsed <= 0n) {
        throw new Error('Amount must be greater than zero.');
      }
      return parsed;
    } catch {
      throw new Error(`Invalid amount "${amount}". Provide a numeric value.`);
    }
  }

  private async ensureSolBalance(walletAddress: PublicKey, amountRequired: bigint) {
    const lamports = await this.connection.getBalance(walletAddress);
    if (BigInt(lamports) < amountRequired) {
      const balance = formatUnits(BigInt(lamports), 9);
      const required = formatUnits(amountRequired, 9);
      throw new Error(`Insufficient SOL balance. You have ${balance} SOL but need ${required} SOL.`);
    }
  }

  private async ensureSplBalance(
    walletAddress: PublicKey,
    asset: BridgeAssetDetails,
    amountRequired: bigint
  ): Promise<SplBalanceCheckResult> {
    if (!asset.mint) {
      throw new Error('Missing mint address for SPL asset.');
    }

    const tokenAccount = await getAssociatedTokenAddress(asset.mint, walletAddress);

    let account;
    try {
      account = await getAccount(this.connection, tokenAccount);
    } catch {
      throw new Error(
        `No associated token account found for ${asset.label}. Create an ATA and fund it first.`
      );
    }

    const balance = BigInt(account.amount.toString());
    if (balance < amountRequired) {
      const readableBalance = formatUnits(balance, asset.decimals);
      const readableRequired = formatUnits(amountRequired, asset.decimals);
      throw new Error(
        `Insufficient ${asset.symbol.toUpperCase()} balance. You have ${readableBalance} but need ${readableRequired}.`
      );
    }

    return { tokenAccount };
  }

  private assertEvmAddress(address: string, label: string) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error(`Invalid ${label} address "${address}". Expected 0x-prefixed 20-byte hex.`);
    }
  }

  /**
   * Generate a mock transaction signature for demonstration
   * Makes it clear this is a simulation
   */
  private generateMockTxHash(): string {
    // Generate a realistic-looking base58 signature but prefix with "MOCK_" to make it clear
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = 'MOCK_BRIDGE_';
    for (let i = 0; i < 75; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validate if an address is a valid Ethereum/Base address or ENS name
   */
  private isValidBaseAddress(address: string): boolean {
    // Check if it's a valid Ethereum address (42 characters starting with 0x)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    
    // Check if it's a potential ENS name (ends with .eth or .base)
    const ensRegex = /^.+\.(eth|base)$/;
    
    return ethAddressRegex.test(address) || ensRegex.test(address);
  }

  /**
   * Get recent bridge transactions for a wallet
   */
  async getBridgeHistory(): Promise<BridgeTransfer[]> {
    // This would query the bridge program's transaction history
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Estimate bridge fees
   */
  async estimateBridgeFee(): Promise<{ baseFee: number; gasFee: number; total: number }> {
    // This would calculate actual bridge fees based on current gas prices and bridge configuration
    const baseFee = 0.001; // 0.001 SOL base fee
    const gasFee = 0.002; // Estimated gas fee for Base transaction
    
    return {
      baseFee,
      gasFee,
      total: baseFee + gasFee
    };
  }
}

export const solanaBridge = new SolanaBridge();
