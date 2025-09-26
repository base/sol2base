import { PublicKey } from '@solana/web3.js';

export function deriveOutgoingMessagePda(
  bridgeProgramId: PublicKey,
  outgoingMessageSalt: Uint8Array
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('outgoing_message'), Buffer.from(outgoingMessageSalt)],
    bridgeProgramId
  );
}

export function deriveMessageToRelayPda(
  relayerProgramId: PublicKey,
  messageToRelaySalt: Uint8Array
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mtr'), Buffer.from(messageToRelaySalt)],
    relayerProgramId
  );
}
