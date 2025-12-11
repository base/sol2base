# Deploy an SPL token and bridge it to Base (quick guide)

Follow these steps end-to-end using the terminal in terminallyonchain.com and Basescan.

[Terminally Onchain](terminallyonchain.com) runs on Solana Devnet only. If you want to run it on Solana Mainnet, you can use the [original repo](https://github.com/base/sol2base) with the env variable NEXT_PUBLIC_ENABLE_MAINNET=false 

## 1) Mint an SPL token on Solana devnet (full supply to your wallet)
In the [terminal app](terminallyonchain.com) or your local version of it:
```
deploySpl <name> <symbol> <decimals> <supply>
```
Example:
```
deploySpl MyToken MYT 6 1000000
```

- Creates a new mint, initializes your ATA, and mints the entire supply to your connected wallet.
- Record the SPL mint address it prints (call this `SPL_MINT`).

## 2) Derive the remoteToken (bytes32) from the SPL mint address
In the terminal app:
```
remoteToken <SPL_MINT>
```
Copy the resulting `remote token` (32-byte hex, call it `REMOTE_TOKEN_BYTES32`).

Note: remoteToken derived bytes are independent of the cluster (It works both on devnet and mainnet the same, so you can use the same commandline for both)

## 3) Deploy the ERC-20 twin on Base (Sepolia or Mainnet)
1. Go to Basescan for the CrossChainERC20Factory on your target network:
   - Base Sepolia factory: [use the docs](https://docs.base.org/base-chain/quickstart/base-solana-bridge#base-mainnet)
   - Base Mainnet factory: [use the docs](https://docs.base.org/base-chain/quickstart/base-solana-bridge#base-mainnet)
2. Open the **Write Contract** tab and connect (or use a connected wallet in the UI).
3. Call `deploy(remoteToken,name,symbol,decimals)` with:
   - `remoteToken`: `REMOTE_TOKEN_BYTES32` (from step 2)
   - `name`: same as your SPL token name
   - `symbol`: same as your SPL token symbol
   - `decimals`: same as your SPL token decimals (e.g., 6)
4. Submit the transaction. When it confirms, open the tx on Basescan and copy the newly deployed ERC-20 address (call this `REMOTE_ERC20`).

## 4) Bridge your SPL tokens to Base
Back [terminal app](terminallyonchain.com) or your local version of it:
```
bridge <amount> <SPL_MINT> <destination_on_base> --remote <REMOTE_ERC20> --decimals <decimals>
```
Example:
```
bridge 100 MYT_SPL_MINT 0xYourBaseAddress --remote 0xDeployedErc20 --decimals 6
```
Tips:
- `<destination_on_base>` is the Base address to receive the bridged ERC-20.
- Ensure you have enough SOL for fees on Solana devnet.
- If the mint is already provided as `<SPL_MINT>`, you don’t need `--mint` again.

## 5) Verify
- On Basescan, check the ERC-20 balance for `<destination_on_base>` at `REMOTE_ERC20`.
- On Solana explorer (devnet), you’ll see the debited SPL balance from your ATA for `SPL_MINT`.

That’s it: you created an SPL token, derived its remote token id, deployed the Base-side ERC-20, and bridged your supply across. Use these same steps for Base Sepolia (test) or Base Mainnet (production).***

