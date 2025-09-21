# sol2base

<div align="center">
  <img src="assets/sol2base.png" alt="sol2base Bridge" width="800" />
</div>

<div align="center">
  <h3>A Solana to Base bridge application that enables seamless SOL transfers from Solana Devnet to Base Sepolia testnet.</h3>
</div>

<div align="center">
  
![sol2base Bridge](https://img.shields.io/badge/Solana-Base-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)

</div>

## 🌉 features

- **Bridge functionality**: SOL bridging from Solana Devnet to Base Sepolia
- **CDP Faucet integration**: Get SOL from Coinbase Developer Platform
- **Address resolution**: Support for ENS names and Basenames
- **Real-time balance**: Live SOL balance tracking for connected wallet
- **Transaction status**: Complete bridge transaction history and status monitoring (to the Solana Devnet side; as of 9/20/25 seems to be some bridge infra issue on the Base Sepolia side)
- **Responsive design**: Clean, modern interface that works on all devices

## 🚀 quickstart

### pre-reqs

- Node.js 18+ 
- npm or yarn
- Solana wallet (Phantom, Solflare) to connect in the UI

### installation

1. clone the repo:
```bash
git clone https://github.com/Jnix2007/sol2base.git
cd sol2base
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

5. start your dev server:
```bash
npm run dev
```

6. open [http://localhost:3000](http://localhost:3000)

## 🔧 how it woooorks

### Bridge process

1. **connect wallet**: Connect Solana wallet (Phantom/Solflare)
2. **get SOL**: Use the integrated CDP Faucet to get SOL on Solana Devnet
3. **enter details**: Specify amount and destination (Base Sepolia address, ENS, or Basename)
4. **Bridge!**: Execute the bridge txn
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

- **source**: Solana Devnet
- **destination**: Base Sepolia Testnet
- **Faucet**: CDP Solana Devnet SOL Faucet
- **Backup Faucet**: [faucet.solana.com](https://faucet.solana.com)

## 🛠️ development

### project structure

```
sol2base/
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
- `src/lib/realBridgeImplementation.ts` - Real bridge transaction logic
- `src/lib/cdpFaucet.ts` - CDP faucet integration
- `src/lib/addressResolver.ts` - ENS/Basename resolution
- `src/components/MainContent.tsx` - Main application interface

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

The Base team that put this together is cracked and it was fucking dope to be at Basecamp in-person when this was announced.

- [Base](https://base.org) for the bridge infra
- [Coinbase Developer Platform](https://docs.cdp.coinbase.com) for faucet services & general badassery
- [Solana](https://solana.com) for the blockchain infra
- The open-source community for the amazing tools and libraries

## 🔗 links

- **Live Demo**: https://sol2base.xyz/
- **Base Bridge docs**: [github.com/base/bridge](https://github.com/base/bridge)
- **Solana docs**: [docs.solana.com](https://docs.solana.com)
- **CDP docs**: [docs.cdp.coinbase.com](https://docs.cdp.coinbase.com)

---

**"Base is a bridge, not an island." Play positive-sum games, win positive-sum prizes.** 🌉