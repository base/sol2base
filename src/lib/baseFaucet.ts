/**
 * Base Sepolia Faucet Service using CDP API
 * This service makes requests to our API endpoint which uses CDP SDK server-side
 */
export class BaseFaucetService {
  /**
   * Request USDC from Base Sepolia faucet via CDP
   * @param address - Base Sepolia address to receive USDC
   * @returns Promise with transaction details
   */
  async requestUsdc(address: string): Promise<{
    transactionHash: string;
    amount: number;
    explorerUrl: string;
  }> {
    try {
      // Validate address format
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid Base address format. Please enter a valid Ethereum address.');
      }

      console.log(`Requesting USDC from Base faucet for address: ${address}`);

      // Make request to our API endpoint
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresSetup) {
          throw new Error('CDP API not configured. Please set up your CDP credentials in .env.local');
        }
        throw new Error(data.error || 'Faucet request failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Faucet request was not successful');
      }

      return {
        transactionHash: data.transactionHash,
        amount: data.amount,
        explorerUrl: data.explorerUrl
      };

    } catch (error) {
      console.error('Base faucet request failed:', error);
      
      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        throw error;
      }
      
      throw new Error('Faucet request failed. Please try again later.');
    }
  }

  /**
   * Check faucet configuration and status
   */
  async checkStatus(): Promise<{
    configured: boolean;
    network: string;
    token: string;
    amount: number;
  }> {
    try {
      const response = await fetch('/api/faucet', {
        method: 'GET',
      });

      const data = await response.json();
      
      return {
        configured: data.configured || false,
        network: data.network || 'Base Sepolia',
        token: data.token || 'USDC',
        amount: data.amount || 1
      };
    } catch (error) {
      console.error('Failed to check faucet status:', error);
      return {
        configured: false,
        network: 'Base Sepolia',
        token: 'USDC',
        amount: 1
      };
    }
  }

  /**
   * Get faucet information
   */
  getFaucetInfo() {
    return {
      network: 'Base Sepolia',
      token: 'USDC',
      amount: 1,
      description: 'Official CDP Faucet for Base Sepolia USDC',
      rateLimit: '24 hour cooldown per address',
      explorer: 'https://sepolia.basescan.org'
    };
  }
}

// Export singleton instance
export const baseFaucet = new BaseFaucetService();
