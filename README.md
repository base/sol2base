# Sol2Base - Solana to Base Bridge

A modern web application that allows users to bridge USDC tokens from Solana Devnet to Base Sepolia using the official [Base/Solana bridge](https://github.com/base/bridge).

![Sol2Base Screenshot](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Sol2Base+Bridge+Interface)

## 🚀 Features

- **Wallet Integration**: Connect your Solana wallet (Phantom, Solflare, etc.)
- **Test Token Faucet**: Get free USDC tokens on Solana Devnet
- **Cross-Chain Bridge**: Bridge USDC from Solana Devnet to Base Sepolia
- **ENS/Basename Support**: Enter Base addresses or ENS/basename destinations
- **Real-Time Balances**: View your SOL and USDC balances
- **Transaction Tracking**: Monitor bridge transactions with status updates
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS

## 🛠 Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: Solana Wallet Adapter
- **Blockchain**: Solana Web3.js
- **Bridge**: Official Base/Solana bridge contracts

## 🏗 Architecture

### Smart Contracts
- **Base Sepolia Contracts**:
  - Bridge: `0x5961B1579913632c91c8cdC771cF48251A4B54F0`
  - Bridge Validator: `0xc317307EfC64e39B1ec2ADAf507a64f8276263cF`
  - Wrapped USDC: `0x4752285a93F5d0756bB2D6ed013b40ea8527a8DA`

- **Solana Devnet Programs**:
  - Bridge Program: `83hN2esneZUbKgLfUvo7uzas4g7kyiodeNKAqZgx5MbH`
  - Base Relayer: `J29jxzRsQmkpxkJptuaxYXgyNqjFZErxXtDWQ4ma3k51`
  - Test USDC: `8KkQRERXdASmXqeWw7sPFB56wLxyHMKc9NPDW64EEL31`

### Components
- `BridgeInterface`: Main bridge interface component
- `WalletProvider`: Solana wallet connection provider
- `FaucetButton`: USDC faucet functionality
- `BridgeForm`: Bridge transaction form
- `BalanceDisplay`: Real-time balance display
- `TransactionStatus`: Transaction history and status

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Solana wallet (Phantom recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sol2base
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up CDP API credentials**
   ```bash
   # Copy the environment template
   cp env.template .env.local
   
   # Edit .env.local and add your CDP credentials:
   # CDP_API_KEY_ID=your-api-key-id
   # CDP_API_KEY_SECRET=your-api-key-secret  
   # CDP_WALLET_SECRET=your-wallet-secret
   ```
   
   Get your CDP API credentials from [CDP Portal](https://portal.cdp.coinbase.com/access/api)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` (or `http://localhost:3001` if port 3000 is in use)

### Usage

1. **Connect Wallet**: Click "Select Wallet" and connect your Solana wallet
2. **Get Test Tokens**: Use the CDP Faucet to get 1 USDC on Solana Devnet (10 claims per 24 hours)
3. **Bridge to Base**: Enter a Base Sepolia address and amount to bridge
4. **Monitor Progress**: Track your transactions in the transaction history

## 🔧 Configuration

The application uses the following networks:

- **Solana Devnet**: For testing Solana transactions
- **Base Sepolia**: For testing Base transactions

Bridge configuration can be modified in `src/lib/constants.ts`:

```typescript
export const BRIDGE_CONFIG = {
  minBridgeAmount: 1000000, // 1 USDC (6 decimals)
  estimatedGasLimit: 200000,
  requiredConfirmations: 12,
  bridgeTimeout: 15 * 60 * 1000, // 15 minutes
};
```

## 🎯 How It Works

### Bridging Process

1. **Initiate Bridge**: User specifies amount and Base destination address
2. **Solana Transaction**: Tokens are locked in the Solana bridge contract
3. **Proof Generation**: Bridge validators generate merkle proofs (~15 minutes)
4. **Base Completion**: Tokens are minted on Base Sepolia to the destination

### Mock Implementation

For demonstration purposes, this application includes mock services:

- **Mock Faucet**: Simulates USDC token distribution
- **Mock Balances**: Tracks token balances locally
- **Mock Bridge**: Simulates bridge transactions

To integrate with real contracts, uncomment the real implementation code in:
- `src/lib/bridge.ts`
- `src/lib/faucet.ts`

## 🚨 Important Notes

⚠️ **Testnet Only**: This application is configured for testnets only:
- Solana Devnet
- Base Sepolia

⚠️ **No Real Value**: Test tokens have no real-world value

⚠️ **Development**: This is a demonstration application. For production use:
- Implement proper error handling
- Add comprehensive testing
- Integrate with real faucet services
- Add proper authentication
- Implement rate limiting

## 🛡 Security Considerations

- Never use mainnet private keys in development
- Always verify contract addresses before transactions
- Implement proper input validation
- Use secure RPC endpoints in production
- Add transaction confirmation requirements

## 📚 Resources

- [Base/Solana Bridge Repository](https://github.com/base/bridge)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Base Documentation](https://docs.base.org/)
- [Solana Documentation](https://docs.solana.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Base Team](https://github.com/base) for the official bridge implementation
- [Solana Labs](https://github.com/solana-labs) for the Solana ecosystem
- [Phantom Wallet](https://phantom.app/) for wallet integration

---

**Happy Bridging! 🌉**