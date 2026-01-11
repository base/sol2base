# Terminally Onchain

![CI](https://github.com/AdekunleBamz/sol2base/actions/workflows/ci.yml/badge.svg)

<div align="center">
  <img src="assets/terminally-onchain.png" alt="Terminally Onchain Bridge" width="800" />
</div>

<div align="center">
  <h3>Call any contract on Base from your Solana wallet</h3>
  <h4><i>Call any contract on Base from your Solana wallet</i></h4>
</div>

<div align="center">
  
![Terminally Onchain Bridge](https://img.shields.io/badge/Solana-Base-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)

</div>

## 🌉 features

- **Bridge**: SOL + SPL bridging between Solana Devnet/Mainnet and Base Sepolia/Mainnet
- **Networks**: One-click toggle between Solana Devnet ↔ Base Sepolia and Solana Mainnet ↔ Base Mainnet
- **Base calls**: Attach arbitrary Base contract calls with `--call-*` flags and ABI-encoded calldata
- **Faucet**: Get SOL from Coinbase Developer Platform
- **Address resolution**: Support for ENS names and Basenames
- **Balance**: Live SOL balance tracking for connected wallet
- **Txn status**: Complete bridge transaction history and status monitoring

## 🚀 quickstart

### pre-reqs

- Node.js 18+ 
- npm or yarn
- Solana wallet (Phantom, Solflare) to connect in the UI

### installation

1. clone the repo:
```bash
git clone https://github.com/Jnix2007/terminally-onchain.git
cd terminally-onchain
```

2. install dependencies:
```bash
npm install --legacy-peer-deps
```

3. copy env template:
```bash
cp env.template .env.local
```

4. *(optional)* Add CDP API credentials to `.env.local` for faucet functionality:
```env
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_SECRET=your_cdp_api_key_secret
```

Set `NEXT_PUBLIC_ENABLE_MAINNET=true` in `.env.local` if you want the Solana ↔ Base mainnet option to appear in the UI. Leaving it undefined or any value other than `"true"` keeps the app on devnet/Base Sepolia only.

5. start your dev server:
```bash
npm run dev
```

6. open [http://localhost:3000](http://localhost:3000)

## 🔧 how it woooorks

### Bridge process

1. **connect wallet**: Connect Solana wallet (Phantom/Solflare)
2. **get SOL**: Use the integrated CDP Faucet to get SOL on Solana Devnet (only when you stay on devnet)
3. **enter details**: Specify amount and destination (Base address, ENS, or Basename on the active network)
4. **Bridge!** Execute the bridge txn
5. **monitor**: Track txn status in real-time

### architecture

- **frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Solana integration**: Uses `@solana/wallet-adapter` and `@solana/web3.js`
- **Bridge contracts**: Real Base/Solana bridge smart contracts
- **address resolution**: ENS and Basename support via ethers.js
- **faucet**: CDP (Coinbase Developer Platform) Faucet integration

## 🎨 UI theme

I was going for a fun "hacker" aesthetic:
- **colors**: Bright green (#00ff00) on black background
- **font faces**: JetBrains Mono and Orbitron fonts
- **animations**: Matrix rain effects and glowing text
- **logo**: Pixelated suspension bridge with animated effects

## 📱 components

- **Faucet section**: Get SOL from CDP with rate limiting info, and backup link to SF faucet in case I've exceeded CDP Faucet limits
- **Bridge form**: Input validation & address resolution
- **Balance display**: SOL balance tracking  
- **Transaction history**: Status tracking
- **Wallet integration**: Wallet connection

## 🔗 networks

- **default**: Solana Devnet → Base Sepolia (includes CDP SOL faucet integration)
- **mainnet**: Solana Mainnet → Base Mainnet (no faucet; bring your own SOL)
- **Faucet**: CDP Solana Devnet SOL Faucet
- **Backup Faucet**: [faucet.solana.com](https://faucet.solana.com)

## 🛠️ development

### project structure

```
terminally-onchain/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   ├── lib/                 # Utilities and services
│   └── styles/              # Global styles
├── bridge-contracts/        # Base bridge contracts
├── bridge-solana/          # Solana bridge programs
└── public/                 # Static assets
```

### key files

- `src/lib/bridge.ts` - Main bridge service
- `src/lib/realBridgeImplementation.ts` - Bridge txn logic
- `src/lib/cdpFaucet.ts` - CDP faucet integration
- `src/lib/addressResolver.ts` - ENS/Basename resolution
- `src/components/MainContent.tsx` - Main app interface

## 🔐 security

- **no private keys**: Uses wallet adapter for secure signing
- **address validation**: Validates all addresses before transactions
- **error handling**: Comprehensive error handling and user feedback
- **rate limiting**: Respects faucet rate limits

## 🤝 contributing

Feel free to fork & whatever, building in the open here

1. fork the repo
2. create a feature branch: `git checkout -b feature/amazing-feature`
3. commit your changes: `git commit -m 'Add amazing feature'`
4. push to the branch: `git push origin feature/amazing-feature`
5. open a PR

## 📄 license

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 acknowledgments

The Base team that put this together is cracked and it was dope to be at Basecamp in-person when this was announced.

- [Base](https://base.org) for the bridge infra
- [Coinbase Developer Platform](https://docs.cdp.coinbase.com) for faucet services & general badassery
- [Solana](https://solana.com) for the blockchain infra
- The open-source community for the amazing tools and libraries used along the way

## 🔗 links & useful onchain addresses

- **Live Demo**: https://terminallyonchain.xyz/
- **Base Bridge docs**: [github.com/base/bridge](https://github.com/base/bridge)
- **Solana docs**: [docs.solana.com](https://docs.solana.com)
- **CDP docs**: [docs.cdp.coinbase.com](https://docs.cdp.coinbase.com)
- Bridge program on Solana Devnet: [7c6mteAcTXaQ1MFBCrnuzoZVTTAEfZwa6wgy4bqX3KXC](https://explorer.solana.com/address/7c6mteAcTXaQ1MFBCrnuzoZVTTAEfZwa6wgy4bqX3KXC?cluster=devnet)
- Base Relayer program on Solana Devnet: [56MBBEYAtQAdjT4e1NzHD8XaoyRSTvfgbSVVcEcHj51H](https://explorer.solana.com/address/56MBBEYAtQAdjT4e1NzHD8XaoyRSTvfgbSVVcEcHj51H?cluster=devnet)
- Gas fee receiver (devnet): [AFs1LCbodhvwpgX3u3URLsud6R1XMSaMiQ5LtXw4GKYT](https://explorer.solana.com/address/AFs1LCbodhvwpgX3u3URLsud6R1XMSaMiQ5LtXw4GKYT?cluster=devnet)
- Bridge contract on Base Sepolia: [0x01824a90d32A69022DdAEcC6C5C14Ed08dB4EB9B](https://sepolia.basescan.org/address/0x01824a90d32A69022DdAEcC6C5C14Ed08dB4EB9B)
- Bridge Validator on Base Sepolia: [0xa80C07DF38fB1A5b3E6a4f4FAAB71E7a056a4EC7](https://sepolia.basescan.org/address/0xa80C07DF38fB1A5b3E6a4f4FAAB71E7a056a4EC7)
- Wrapped SOL token CA on Base Sepolia: [0xCace0c896714DaF7098FFD8CC54aFCFe0338b4BC](https://sepolia.basescan.org/address/0xCace0c896714DaF7098FFD8CC54aFCFe0338b4BC)
- Bridge program on Solana Mainnet: [HNCne2FkVaNghhjKXapxJzPaBvAKDG1Ge3gqhZyfVWLM](https://explorer.solana.com/address/HNCne2FkVaNghhjKXapxJzPaBvAKDG1Ge3gqhZyfVWLM)
- Base Relayer program on Solana Mainnet: [g1et5VenhfJHJwsdJsDbxWZuotD5H4iELNG61kS4fb9](https://explorer.solana.com/address/g1et5VenhfJHJwsdJsDbxWZuotD5H4iELNG61kS4fb9)
- Bridge contract on Base Mainnet: [0x3eff766C76a1be2Ce1aCF2B69c78bCae257D5188](https://basescan.org/address/0x3eff766C76a1be2Ce1aCF2B69c78bCae257D5188)
- Bridge Validator on Base Mainnet: [0xAF24c1c24Ff3BF1e6D882518120fC25442d6794B](https://basescan.org/address/0xAF24c1c24Ff3BF1e6D882518120fC25442d6794B)
- CrossChain ERC20 Factory on Base Mainnet: [0xDD56781d0509650f8C2981231B6C917f2d5d7dF2](https://basescan.org/address/0xDD56781d0509650f8C2981231B6C917f2d5d7dF2)
- Relayer Orchestrator on Base Mainnet: [0x8Cfa6F29930E6310B6074baB0052c14a709B4741](https://basescan.org/address/0x8Cfa6F29930E6310B6074baB0052c14a709B4741)
- Wrapped SOL token CA on Base Mainnet: [0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82](https://basescan.org/address/0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82)

---

**"Base is a bridge, not an island."**  🌉 Play positive-sum games, win positive-sum prizes.
