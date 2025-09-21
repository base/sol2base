import { PublicKey } from '@solana/web3.js';

/**
 * Mock balance service for demonstration purposes
 * In a real app, this would query the actual blockchain
 */
class MockBalanceService {
  private balances: Map<string, { sol: number; usdc: number }> = new Map();

  /**
   * Get mock SOL balance for a wallet
   */
  getSolBalance(walletAddress: PublicKey): number {
    const key = walletAddress.toString();
    const balance = this.balances.get(key);
    return balance?.sol || 0.1; // Default to 0.1 SOL for transaction fees
  }

  /**
   * Get mock USDC balance for a wallet
   */
  getUsdcBalance(walletAddress: PublicKey): number {
    const key = walletAddress.toString();
    const balance = this.balances.get(key);
    return balance?.usdc || 0; // Default to 0 USDC
  }

  /**
   * Add USDC tokens to a wallet (simulate faucet)
   */
  addUsdcTokens(walletAddress: PublicKey, amount: number): void {
    const key = walletAddress.toString();
    const currentBalance = this.balances.get(key) || { sol: 0.1, usdc: 0 };
    currentBalance.usdc += amount;
    this.balances.set(key, currentBalance);
  }

  /**
   * Subtract USDC tokens from a wallet (simulate bridge transfer)
   */
  subtractUsdcTokens(walletAddress: PublicKey, amount: number): boolean {
    const key = walletAddress.toString();
    const currentBalance = this.balances.get(key) || { sol: 0.1, usdc: 0 };
    
    if (currentBalance.usdc >= amount) {
      currentBalance.usdc -= amount;
      this.balances.set(key, currentBalance);
      return true;
    }
    return false;
  }

  /**
   * Set initial balance for a wallet
   */
  setBalance(walletAddress: PublicKey, sol: number, usdc: number): void {
    const key = walletAddress.toString();
    this.balances.set(key, { sol, usdc });
  }

  /**
   * Clear all balances (for testing)
   */
  clearBalances(): void {
    this.balances.clear();
  }

  /**
   * Get all balances (for debugging)
   */
  getAllBalances(): Record<string, { sol: number; usdc: number }> {
    const result: Record<string, { sol: number; usdc: number }> = {};
    this.balances.forEach((balance, key) => {
      result[key] = balance;
    });
    return result;
  }
}

// Singleton instance
export const mockBalanceService = new MockBalanceService();
