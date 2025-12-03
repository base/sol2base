# Terminally Onchain v1.1.0 - Base Bridge v0.3.0 Compatibility Update

## **working e2e Bridge restored**

This release updates Terminally Onchain to be compatible with the Base team's September 24, 2025 bridge infrastructure redeploy (v0.3.0), which included breaking changes. The bridge now works end-to-end again, with completion times of just a few seconds for WSOL to land on Base Sepolia. Remember: call any contract on base from your solana wallet.

## **breaking changes from Base Team redeploy**

### **updated Program IDs**
- **Solana Bridge program:** `7c6mteAcTXaQ1MFBCrnuzoZVTTAEfZwa6wgy4bqX3KXC`
- **Solana Base Relayer program:** `56MBBEYAtQAdjT4e1NzHD8XaoyRSTvfgbSVVcEcHj51H`
- **gas fee receiver:** `AFs1LCbodhvwpgX3u3URLsud6R1XMSaMiQ5LtXw4GKYT`

### **account structure changes**
- **OutgoingMessage accounts:** Now use PDAs instead of generated keypairs
- **MessageToRelay accounts:** Now use PDAs instead of generated keypairs
- **PDA seeds:** 
  - OutgoingMessage: `["outgoing_message", 32-byte-salt]`
  - MessageToRelay: `["mtr", 32-byte-salt]`

- **Base Sepolia Bridge:** `0x01824a90d32A69022DdAEcC6C5C14Ed08dB4EB9B`
- **Base Sepolia Bridge validator:** `0xa80C07DF38fB1A5b3E6a4f4FAAB71E7a056a4EC7`
- **Wrapped SOL on Base Sepolia:** `0xCace0c896714DaF7098FFD8CC54aFCFe0338b4BC`

## 🛠️ **technical fixes implemented**

### **Updated WSOL contract address** to the devnet-prod deployment address

### **PDA implementation**
- **single salt usage:** Both OutgoingMessage and MessageToRelay PDAs now use the same 32-byte salt
- **proper seed derivation:** Using exact seed patterns from Base bridge source code
- **raw byte packing:** EVM addresses properly encoded as 20-byte buffers

### **enhanced reliability**
- **improved error handling** for "transaction already processed" scenarios
- **better diagnostics** for debugging bridge issues
- **environment configuration** support for different deployments

## **codebase improvements**

### **streamlined repository**
- **removed 30,000+ lines** of unused generated client code
- **removed unused directories:** bridge-contracts, bridge-solana
- **cleaned up dependencies** and reduced bundle size
- **updated documentation** with all current addresses