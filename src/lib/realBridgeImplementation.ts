import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';
import { parseUnits } from 'ethers';
import { deriveOutgoingMessagePda, deriveMessageToRelayPda, normalizeSalt } from './pdas';
import { SOLANA_DEVNET_CONFIG, DEFAULT_GAS_LIMIT } from './constants';

export type ContractCallType = 'call' | 'delegatecall' | 'create' | 'create2';

export interface BaseContractCall {
  type: ContractCallType;
  target?: string;
  value?: string;
  data?: string;
}

export interface BridgeAssetDetails {
  symbol: string;
  label: string;
  type: 'sol' | 'spl';
  decimals: number;
  remoteAddress: string;
  mint?: PublicKey;
  tokenProgram?: PublicKey;
}

interface CreateBridgeTransactionParams {
  walletAddress: PublicKey;
  destinationAddress: string;
  amount: bigint;
  asset: BridgeAssetDetails;
  tokenAccount?: PublicKey;
  call?: BaseContractCall;
}

/**
 * Real Bridge Implementation using standard Solana libraries
 * Implements the actual bridge instructions without dependency conflicts
 */
export class RealBridgeImplementation {
  private connection: Connection;
  private bridgeProgramId: PublicKey;
  private baseRelayerProgramId: PublicKey;
  private static readonly CALL_TYPE_INDEX: Record<ContractCallType, number> = {
    call: 0,
    delegatecall: 1,
    create: 2,
    create2: 3,
  };

  constructor() {
    this.connection = new Connection(SOLANA_DEVNET_CONFIG.rpcUrl, 'confirmed');
    this.bridgeProgramId = SOLANA_DEVNET_CONFIG.solanaBridge;
    this.baseRelayerProgramId = SOLANA_DEVNET_CONFIG.baseRelayerProgram;
  }

  /**
   * Create a bridge transaction (SOL or SPL) using the deployed programs.
   */
  async createBridgeTransaction(params: CreateBridgeTransactionParams): Promise<Transaction> {
    if (params.asset.type === 'sol') {
      return this.buildSolBridgeTransaction(params);
    }

    return this.buildSplBridgeTransaction(params);
  }

  private createSaltBundle() {
    const salt32 = new Uint8Array(32);
    crypto.getRandomValues(salt32);
    const saltBuffer = normalizeSalt(salt32);

    return {
      saltBuffer,
      outgoingMessagePda: deriveOutgoingMessagePda(saltBuffer),
      messageToRelayPda: deriveMessageToRelayPda(saltBuffer),
    };
  }

  private async buildSolBridgeTransaction({
    walletAddress,
    amount,
    destinationAddress,
    asset,
    call,
  }: CreateBridgeTransactionParams): Promise<Transaction> {
    console.log(`Creating REAL bridge transaction: ${asset.symbol.toUpperCase()} → ${destinationAddress}`);

    try {
      const [bridgeAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('bridge')],
        this.bridgeProgramId
      );

      const [solVaultAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('sol_vault')],
        this.bridgeProgramId
      );

      const { saltBuffer, outgoingMessagePda, messageToRelayPda } = this.createSaltBundle();

      console.info('[sol2base] env=devnet-prod');
      console.info('[sol2base] asset:', asset.label);
      console.info('[sol2base] salt32:', `0x${saltBuffer.toString('hex')}`);
      console.info('[sol2base] outgoingMessagePDA:', outgoingMessagePda.toBase58());
      console.info('[sol2base] messageToRelayPDA:', messageToRelayPda.toBase58());
      console.info('[sol2base] to:', destinationAddress.toLowerCase());
      console.info('[sol2base] remoteToken:', asset.remoteAddress);
      console.info('[sol2base] gasLimit:', DEFAULT_GAS_LIMIT.toString());

      const bridgeAccountInfo = await this.connection.getAccountInfo(bridgeAddress);
      if (!bridgeAccountInfo) {
        throw new Error('Bridge account not found. The bridge may not be initialized on Solana Devnet.');
      }

      const gasFeeReceiver = SOLANA_DEVNET_CONFIG.gasFeeReceiver;

      const [cfgAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        this.baseRelayerProgramId
      );

      const transaction = new Transaction();
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletAddress;

      try {
        const cfgAccountInfo = await this.connection.getAccountInfo(cfgAddress);
        if (!cfgAccountInfo) {
          console.log('❌ Relayer config account does not exist:', cfgAddress.toString());
          throw new Error('Base relayer config account not found. Bridge may not be fully initialized.');
        }

        const relayInstruction = this.createPayForRelayInstruction({
          payer: walletAddress,
          cfg: cfgAddress,
          gasFeeReceiver,
          messageToRelay: messageToRelayPda,
          messageToRelaySalt: saltBuffer,
          systemProgram: SystemProgram.programId,
          outgoingMessage: outgoingMessagePda,
          gasLimit: DEFAULT_GAS_LIMIT,
        });

        const bridgeInstruction = this.createBridgeSolInstruction({
          payer: walletAddress,
          from: walletAddress,
          gasFeeReceiver,
          solVault: solVaultAddress,
          bridge: bridgeAddress,
          outgoingMessage: outgoingMessagePda,
          outgoingMessageSalt: saltBuffer,
          systemProgram: SystemProgram.programId,
          to: destinationAddress,
          amount,
          call,
        });

        transaction.add(relayInstruction);
        transaction.add(bridgeInstruction);
      } catch (error) {
        console.error('❌ Error with relay payment, falling back to bridge-only:', error);

        const fallbackBridgeInstruction = this.createBridgeSolInstruction({
          payer: walletAddress,
          from: walletAddress,
          gasFeeReceiver,
          solVault: solVaultAddress,
          bridge: bridgeAddress,
          outgoingMessage: outgoingMessagePda,
          outgoingMessageSalt: saltBuffer,
          systemProgram: SystemProgram.programId,
          to: destinationAddress,
          amount,
          call,
        });

        transaction.add(fallbackBridgeInstruction);
      }

      return transaction;
    } catch (error) {
      console.error('Error creating bridge transaction:', error);
      throw error;
    }
  }

  private async buildSplBridgeTransaction({
    walletAddress,
    destinationAddress,
    amount,
    asset,
    tokenAccount,
    call,
  }: CreateBridgeTransactionParams): Promise<Transaction> {
    if (!asset.mint) {
      throw new Error('SPL asset is missing a mint address.');
    }

    if (!tokenAccount) {
      throw new Error('Token account is required for SPL bridging.');
    }

    console.log(`Creating REAL bridge transaction: ${asset.symbol.toUpperCase()} SPL → ${destinationAddress}`);

    try {
      const [bridgeAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('bridge')],
        this.bridgeProgramId
      );

      const remoteTokenBytes = this.addressToBytes20(asset.remoteAddress);
      const [tokenVaultAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_vault'), asset.mint.toBuffer(), remoteTokenBytes],
        this.bridgeProgramId
      );

      const { saltBuffer, outgoingMessagePda, messageToRelayPda } = this.createSaltBundle();

      console.info('[sol2base] env=devnet-prod');
      console.info('[sol2base] asset:', asset.label);
      console.info('[sol2base] mint:', asset.mint.toBase58());
      console.info('[sol2base] tokenVault:', tokenVaultAddress.toBase58());
      console.info('[sol2base] salt32:', `0x${saltBuffer.toString('hex')}`);
      console.info('[sol2base] outgoingMessagePDA:', outgoingMessagePda.toBase58());
      console.info('[sol2base] messageToRelayPDA:', messageToRelayPda.toBase58());
      console.info('[sol2base] to:', destinationAddress.toLowerCase());
      console.info('[sol2base] remoteToken:', asset.remoteAddress);

      const bridgeAccountInfo = await this.connection.getAccountInfo(bridgeAddress);
      if (!bridgeAccountInfo) {
        throw new Error('Bridge account not found. The bridge may not be initialized on Solana Devnet.');
      }

      const gasFeeReceiver = SOLANA_DEVNET_CONFIG.gasFeeReceiver;

      const [cfgAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        this.baseRelayerProgramId
      );

      const transaction = new Transaction();
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletAddress;

      try {
        const cfgAccountInfo = await this.connection.getAccountInfo(cfgAddress);
        if (!cfgAccountInfo) {
          console.log('❌ Relayer config account does not exist:', cfgAddress.toString());
          throw new Error('Base relayer config account not found. Bridge may not be fully initialized.');
        }

        const relayInstruction = this.createPayForRelayInstruction({
          payer: walletAddress,
          cfg: cfgAddress,
          gasFeeReceiver,
          messageToRelay: messageToRelayPda,
          messageToRelaySalt: saltBuffer,
          systemProgram: SystemProgram.programId,
          outgoingMessage: outgoingMessagePda,
          gasLimit: DEFAULT_GAS_LIMIT,
        });

        const bridgeInstruction = this.createBridgeSplInstruction({
          payer: walletAddress,
          from: walletAddress,
          gasFeeReceiver,
          mint: asset.mint,
          fromTokenAccount: tokenAccount,
          tokenVault: tokenVaultAddress,
          bridge: bridgeAddress,
          outgoingMessage: outgoingMessagePda,
          outgoingMessageSalt: saltBuffer,
          systemProgram: SystemProgram.programId,
          tokenProgram: asset.tokenProgram ?? TOKEN_PROGRAM_ID,
          to: destinationAddress,
          remoteToken: asset.remoteAddress,
          amount,
          call,
        });

        transaction.add(relayInstruction);
        transaction.add(bridgeInstruction);
      } catch (error) {
        console.error('❌ Error with relay payment, falling back to bridge-only:', error);

        const fallbackBridgeInstruction = this.createBridgeSplInstruction({
          payer: walletAddress,
          from: walletAddress,
          gasFeeReceiver,
          mint: asset.mint,
          fromTokenAccount: tokenAccount,
          tokenVault: tokenVaultAddress,
          bridge: bridgeAddress,
          outgoingMessage: outgoingMessagePda,
          outgoingMessageSalt: saltBuffer,
          systemProgram: SystemProgram.programId,
          tokenProgram: asset.tokenProgram ?? TOKEN_PROGRAM_ID,
          to: destinationAddress,
          remoteToken: asset.remoteAddress,
          amount,
          call,
        });

        transaction.add(fallbackBridgeInstruction);
      }

      return transaction;
    } catch (error) {
      console.error('Error creating bridge transaction:', error);
      throw error;
    }
  }

  /**
   * Create pay_for_relay instruction manually
   */
  private createPayForRelayInstruction({
    payer,
    cfg,
    gasFeeReceiver,
    messageToRelay,
    messageToRelaySalt,
    systemProgram,
    outgoingMessage,
    gasLimit,
  }: {
    payer: PublicKey;
    cfg: PublicKey;
    gasFeeReceiver: PublicKey;
    messageToRelay: PublicKey;
    messageToRelaySalt: Buffer;
    systemProgram: PublicKey;
    outgoingMessage: PublicKey;
    gasLimit: bigint;
  }): TransactionInstruction {

    // pay_for_relay discriminator
    const discriminator = Buffer.from([41, 191, 218, 201, 250, 164, 156, 55]);

    // Instruction data: discriminator + mtrSalt + outgoingMessage + gasLimit
    const data = Buffer.alloc(8 + 32 + 32 + 8);
    let offset = 0;

    discriminator.copy(data, offset);
    offset += 8;

    messageToRelaySalt.copy(data, offset);
    offset += 32;

    const outgoingMessageBytes = outgoingMessage.toBuffer();
    outgoingMessageBytes.copy(data, offset);
    offset += 32;

    data.writeBigUInt64LE(gasLimit, offset);

    console.log('🔍 PayForRelay instruction data length:', data.length);
    console.log('🔍 PayForRelay discriminator:', Array.from(discriminator));
    console.log('🔍 PayForRelay outgoing message:', outgoingMessage.toString());
    console.log('🔍 PayForRelay gas limit:', gasLimit.toString());

    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: cfg, isSigner: false, isWritable: true },
      { pubkey: gasFeeReceiver, isSigner: false, isWritable: true },
      { pubkey: messageToRelay, isSigner: false, isWritable: true },
      { pubkey: systemProgram, isSigner: false, isWritable: false },
    ];

    console.log('🔍 PayForRelay accounts:');
    console.log('  [0] payer:', payer.toString(), '(signer, writable)');
    console.log('  [1] cfg:', cfg.toString(), '(writable)');
    console.log('  [2] gasFeeReceiver:', gasFeeReceiver.toString(), '(writable) ⚠️ THIS IS THE CRITICAL ONE');
    console.log('  [3] messageToRelay:', messageToRelay.toString(), '(writable)');
    console.log('  [4] systemProgram:', systemProgram.toString(), '(readonly)');

    return new TransactionInstruction({
      keys,
      programId: this.baseRelayerProgramId,
      data,
    });
  }

  /**
   * Create bridge_sol instruction manually using standard Solana libraries
   */
  private createBridgeSolInstruction({
    payer,
    from,
    gasFeeReceiver,
    solVault,
    bridge,
    outgoingMessage,
    outgoingMessageSalt,
    systemProgram,
    to,
    amount,
    call,
  }: {
    payer: PublicKey;
    from: PublicKey;
    gasFeeReceiver: PublicKey;
    solVault: PublicKey;
    bridge: PublicKey;
    outgoingMessage: PublicKey;
    outgoingMessageSalt: Buffer;
    systemProgram: PublicKey;
    to: string;
    amount: bigint;
    call?: BaseContractCall;
  }): TransactionInstruction {

    const discriminator = Buffer.from([190, 190, 32, 158, 75, 153, 32, 86]);

    const toBytes = this.addressToBytes20(to);
    const callBuffer = this.serializeOptionalCall(call);

    // Instruction data: discriminator + salt + to + amount + call_option
    const data = Buffer.alloc(8 + 32 + 20 + 8 + callBuffer.length);
    let offset = 0;

    discriminator.copy(data, offset);
    offset += 8;

    outgoingMessageSalt.copy(data, offset);
    offset += 32;

    toBytes.copy(data, offset);
    offset += 20;

    data.writeBigUInt64LE(amount, offset);
    offset += 8;

    callBuffer.copy(data, offset);

    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: from, isSigner: false, isWritable: true },
      { pubkey: gasFeeReceiver, isSigner: false, isWritable: true },
      { pubkey: solVault, isSigner: false, isWritable: true },
      { pubkey: bridge, isSigner: false, isWritable: true },
      { pubkey: outgoingMessage, isSigner: false, isWritable: true },
      { pubkey: systemProgram, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: this.bridgeProgramId,
      data,
    });
  }

  private createBridgeSplInstruction({
    payer,
    from,
    gasFeeReceiver,
    mint,
    fromTokenAccount,
    tokenVault,
    bridge,
    outgoingMessage,
    outgoingMessageSalt,
    systemProgram,
    tokenProgram,
    to,
    remoteToken,
    amount,
    call,
  }: {
    payer: PublicKey;
    from: PublicKey;
    gasFeeReceiver: PublicKey;
    mint: PublicKey;
    fromTokenAccount: PublicKey;
    tokenVault: PublicKey;
    bridge: PublicKey;
    outgoingMessage: PublicKey;
    outgoingMessageSalt: Buffer;
    systemProgram: PublicKey;
    tokenProgram: PublicKey;
    to: string;
    remoteToken: string;
    amount: bigint;
    call?: BaseContractCall;
  }): TransactionInstruction {

    const discriminator = Buffer.from([87, 109, 172, 103, 8, 187, 223, 126]);

    const toBytes = this.addressToBytes20(to);
    const remoteTokenBytes = this.addressToBytes20(remoteToken);
    const callBuffer = this.serializeOptionalCall(call);

    // Instruction data: discriminator + salt + to + remote_token + amount + call_option
    const data = Buffer.alloc(8 + 32 + 20 + 20 + 8 + callBuffer.length);
    let offset = 0;

    discriminator.copy(data, offset);
    offset += 8;

    outgoingMessageSalt.copy(data, offset);
    offset += 32;

    toBytes.copy(data, offset);
    offset += 20;

    remoteTokenBytes.copy(data, offset);
    offset += 20;

    data.writeBigUInt64LE(amount, offset);
    offset += 8;

    callBuffer.copy(data, offset);

    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: from, isSigner: true, isWritable: true },
      { pubkey: gasFeeReceiver, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: fromTokenAccount, isSigner: false, isWritable: true },
      { pubkey: bridge, isSigner: false, isWritable: true },
      { pubkey: tokenVault, isSigner: false, isWritable: true },
      { pubkey: outgoingMessage, isSigner: false, isWritable: true },
      { pubkey: tokenProgram, isSigner: false, isWritable: false },
      { pubkey: systemProgram, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: this.bridgeProgramId,
      data,
    });
  }

  /**
   * Convert Ethereum address to 20-byte buffer
   */
  private addressToBytes20(address: string): Buffer {
    try {
      // Remove 0x prefix if present
      const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;

      // Ensure it's exactly 40 hex characters (20 bytes)
      if (cleanAddress.length !== 40) {
        throw new Error(`Invalid Ethereum address length: expected 40 hex chars, got ${cleanAddress.length}`);
      }

      // Validate hex characters
      if (!/^[0-9a-fA-F]{40}$/.test(cleanAddress)) {
        throw new Error(`Invalid Ethereum address format: contains non-hex characters`);
      }

      return Buffer.from(cleanAddress, 'hex');
    } catch (error) {
      console.error(`Error converting address ${address}:`, error);
      throw new Error(`Failed to convert Ethereum address: ${address}`);
    }
  }

  private serializeOptionalCall(call?: BaseContractCall): Buffer {
    if (!call) {
      return Buffer.from([0]);
    }

    const normalizedType = call.type.toLowerCase() as ContractCallType;
    const discriminator = RealBridgeImplementation.CALL_TYPE_INDEX[normalizedType];

    if (discriminator === undefined) {
      throw new Error(`Unsupported call type "${call.type}". Use call | delegatecall | create | create2.`);
    }

    if ((normalizedType === 'call' || normalizedType === 'delegatecall') && !call.target) {
      throw new Error('callTarget is required for call and delegatecall operations.');
    }

    const targetBuffer =
      normalizedType === 'create' || normalizedType === 'create2'
        ? Buffer.alloc(20)
        : this.addressToBytes20((call.target as string).toLowerCase());

    const valueBuffer = Buffer.alloc(16);
    this.writeUint128LE(this.parseCallValue(call.value), valueBuffer);

    const payload = this.hexToBuffer(call.data ?? '0x');
    const payloadLength = Buffer.alloc(4);
    payloadLength.writeUInt32LE(payload.length, 0);

    return Buffer.concat([
      Buffer.from([1, discriminator]),
      targetBuffer,
      valueBuffer,
      payloadLength,
      payload,
    ]);
  }

  private parseCallValue(value?: string): bigint {
    if (!value || value.trim().length === 0) {
      return 0n;
    }

    try {
      const parsed = parseUnits(value, 18);
      const max = (1n << 128n) - 1n;
      if (parsed > max) {
        throw new Error('Call value exceeds 128-bit limit.');
      }
      return parsed;
    } catch {
      throw new Error(`Invalid call value "${value}". Provide a decimal ETH amount.`);
    }
  }

  private writeUint128LE(value: bigint, buffer: Buffer) {
    if (buffer.length < 16) {
      throw new Error('Uint128 buffer must have at least 16 bytes.');
    }

    let temp = value;
    for (let i = 0; i < 16; i += 1) {
      buffer[i] = Number(temp & 0xffn);
      temp >>= 8n;
    }
  }

  private hexToBuffer(value: string): Buffer {
    if (!value) {
      return Buffer.alloc(0);
    }

    const clean = value.startsWith('0x') ? value.slice(2) : value;
    if (clean.length === 0) {
      return Buffer.alloc(0);
    }

    if (clean.length % 2 !== 0) {
      throw new Error('Hex data must have an even number of characters.');
    }

    if (!/^[0-9a-fA-F]+$/.test(clean)) {
      throw new Error('Hex data contains invalid characters.');
    }

    return Buffer.from(clean, 'hex');
  }

  /**
   * Submit bridge transaction
   */
  async submitBridgeTransaction(
    transaction: Transaction,
    walletAddress: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<string> {
    // Sign the transaction with the user's wallet
    const signedTransaction = await signTransaction(transaction);

    const serialized = signedTransaction.serialize();

    const primarySignature = signedTransaction.signatures[0]?.signature
      ? bs58.encode(signedTransaction.signatures[0].signature as Buffer)
      : undefined;

    let signature: string | undefined;

    try {
      // Send the signed transaction
      signature = await this.connection.sendRawTransaction(serialized, {
        skipPreflight: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const isAlreadyProcessed = message.includes('already been processed');

      if (isAlreadyProcessed && primarySignature) {
        console.warn('⚠️ Transaction already processed, reusing existing signature');
        signature = primarySignature;
      } else {
        throw error;
      }
    }

    if (!signature) {
      if (primarySignature) {
        signature = primarySignature;
      } else {
        throw new Error('Unable to determine transaction signature');
      }
    }

    // Confirm transaction
    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

}

export const realBridgeImplementation = new RealBridgeImplementation();
