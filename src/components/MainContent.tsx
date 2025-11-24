'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { encodeFunctionData, createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { formatUnits } from 'ethers';
import { solanaBridge, type BridgeAssetOverrides } from '../lib/bridge';
import { BASE_SEPOLIA_CONFIG } from '../lib/constants';
import {
  parseTerminalCommand,
  type ParsedCommand,
  type BridgeCommandPayload,
  type BridgeCallCommandPayload,
} from '../lib/terminalParser';
import type { BaseContractCall } from '../lib/realBridgeImplementation';

type TerminalVariant = 'system' | 'command' | 'success' | 'error';

interface LogEntry {
  id: string;
  variant: TerminalVariant;
  content: string;
  timestamp: string;
}

const createLog = (variant: TerminalVariant, content: string): LogEntry => ({
  id: `${variant}-${Date.now()}-${Math.random()}`,
  variant,
  content,
  timestamp: new Date().toLocaleTimeString(),
});

const BRIDGE_ABI = [
  {
    name: 'getPredictedTwinAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ internalType: 'bytes32', name: 'sender', type: 'bytes32' }],
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
  },
] as const;

const toBytes32Hex = (pubkey: PublicKey): `0x${string}` =>
  `0x${Array.from(pubkey.toBytes())
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')}`;

const truncateAddress = (value: string) =>
  value.length > 10 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;

export const MainContent: React.FC = () => {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [commandBatch, setCommandBatch] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [recentSignatures, setRecentSignatures] = useState<string[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [pendingBridge, setPendingBridge] = useState<BridgeCommandPayload | null>(null);
  const [bridgeOverrides, setBridgeOverrides] = useState<BridgeAssetOverrides | undefined>(undefined);
  const [pendingCall, setPendingCall] = useState<BaseContractCall | null>(null);
  const [pendingCallMeta, setPendingCallMeta] = useState<BridgeCallCommandPayload | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [twinAddress, setTwinAddress] = useState<string | null>(null);
  const [isTwinLoading, setIsTwinLoading] = useState(false);
  const [twinError, setTwinError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const supportedAssets = useMemo(() => solanaBridge.getSupportedAssets(), []);
  const baseClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(BASE_SEPOLIA_CONFIG.rpcUrl),
      }),
    []
  );

  const appendLog = useCallback((variant: TerminalVariant, content: string) => {
    setLogEntries(prev => [createLog(variant, content), ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries]);

  useEffect(() => {
    if (!publicKey) {
      setTwinAddress(null);
      setTwinError(null);
      return;
    }

    let cancelled = false;
    const resolveTwin = async () => {
      setIsTwinLoading(true);
      setTwinError(null);
      try {
        const sender = toBytes32Hex(publicKey);
        const address = await baseClient.readContract({
          address: BASE_SEPOLIA_CONFIG.bridge as `0x${string}`,
          abi: BRIDGE_ABI,
          functionName: 'getPredictedTwinAddress',
          args: [sender],
        });
        if (!cancelled) {
          setTwinAddress(address as string);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to fetch twin address.';
          setTwinError(message);
          setTwinAddress(null);
        }
      } finally {
        if (!cancelled) {
          setIsTwinLoading(false);
        }
      }
    };

    resolveTwin();

    return () => {
      cancelled = true;
    };
  }, [baseClient, publicKey]);

  const runWithLock = useCallback(
    async (action: () => Promise<void>) => {
      setIsLocked(true);
      try {
        await action();
      } finally {
        setIsLocked(false);
      }
    },
    []
  );

  const printHelp = useCallback(() => {
    appendLog('system', 'commands:');
    appendLog(
      'system',
      " bridge <amount> <asset> <destination> [--mint <mint> --remote <0x..> --decimals <n> --call-type <kind> --call-target <addr> --call-value <eth> --call-data <0x..>]"
    );
    appendLog('system', ' balance                     show SOL + tracked SPL balances');
    appendLog('system', ' assets                      list built-in asset shortcuts');
    appendLog('system', ' faucet sol                  drip SOL from cdp faucet');
    appendLog('system', ' history                     recent Solana transaction signatures');
    appendLog('system', ' clear                       reset the terminal output');
    appendLog('system', ' help                        display this guide');
  }, [appendLog]);

  const printAssets = useCallback(() => {
    if (!supportedAssets.length) {
      appendLog('system', 'no predefined assets — use custom flags.');
      return;
    }
    supportedAssets.forEach(asset => {
      appendLog(
        'system',
        `${asset.symbol.toUpperCase().padEnd(6)} :: ${asset.label} :: mint=${asset.mintAddress ?? 'custom'} :: remote=${asset.remoteAddress ?? 'set via --remote'}`
      );
    });
  }, [appendLog, supportedAssets]);

  const printHistory = useCallback(() => {
    if (recentSignatures.length === 0) {
      appendLog('system', 'no bridge transactions yet.');
      return;
    }

    appendLog('system', 'recent signatures:');
    recentSignatures.forEach(sig => {
      appendLog('system', ` • https://explorer.solana.com/tx/${sig}?cluster=devnet`);
    });
  }, [appendLog, recentSignatures]);

  const handleFaucet = useCallback(
    async (asset: string) => {
      if (asset !== 'sol') {
        appendLog('error', 'Faucet command rejected: only SOL is supported.');
        return;
      }

      if (!publicKey) {
        appendLog('error', 'Faucet command rejected: wallet not connected.');
        return;
      }

      appendLog('system', 'requesting 0.00125 SOL from CDP faucet...');

      try {
        const response = await fetch('/api/faucet/sol', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: publicKey.toBase58() }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'SOL faucet request failed.');
        }

        appendLog(
          'success',
          `faucet success :: ${data.amount} SOL :: explorer https://explorer.solana.com/tx/${data.transactionHash}?cluster=devnet`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'SOL faucet request failed.';
        appendLog('error', message);
      }
    },
    [appendLog, publicKey]
  );

  const queueBridge = useCallback(
    (payload: BridgeCommandPayload) => {
      const overrides: BridgeAssetOverrides = {};
      if (payload.flags.mint) {
        overrides.mint = payload.flags.mint;
      }
      if (payload.flags.remote) {
        overrides.remote = payload.flags.remote;
      }
      if (typeof payload.flags.decimals === 'number') {
        overrides.decimals = payload.flags.decimals;
      }

      setPendingBridge(payload);
      setBridgeOverrides(Object.keys(overrides).length ? overrides : undefined);
      setPendingCall(null);
      setPendingCallMeta(null);

      appendLog(
        'system',
        `bridge staged :: ${payload.amount} ${payload.asset.toUpperCase()} → ${payload.destination}`
      );
    },
    [appendLog]
  );

  const inferArg = (value: string) => {
    if (/^0x[a-fA-F0-9]{40}$/.test(value)) {
      return { type: 'address', value: value as `0x${string}` };
    }
    if (/^0x[0-9a-fA-F]+$/.test(value)) {
      return { type: 'bytes', value: value as `0x${string}` };
    }
    if (/^\d+$/.test(value)) {
      return { type: 'uint256', value: BigInt(value) };
    }
    return { type: 'string', value };
  };

  const queueBridgeCall = useCallback(
    (payload: BridgeCallCommandPayload) => {
      try {
        const parsed = payload.args.map(inferArg);
        const abiItem = {
          name: payload.functionName,
          type: 'function' as const,
          stateMutability: payload.value ? 'payable' : 'nonpayable',
          inputs: parsed.map((arg, idx) => ({ name: `arg${idx}`, type: arg.type })),
          outputs: [],
        };
        const data = encodeFunctionData({
          abi: [abiItem],
          functionName: payload.functionName,
          args: parsed.map(arg => arg.value),
        });

        const call: BaseContractCall = {
          type: 'call',
          target: payload.contract,
          value: payload.value,
          data,
        };

        setPendingCall(call);
        setPendingCallMeta(payload);

        appendLog(
          'system',
          `bridgecall staged :: ${payload.functionName} @ ${payload.contract}`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to encode bridgecall.';
        appendLog('error', message);
      }
    },
    [appendLog]
  );

  const executeQueuedBridge = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      appendLog('error', 'Execute blocked: wallet not connected.');
      return;
    }

    if (!pendingBridge) {
      appendLog('error', 'Execute blocked: no bridge command queued.');
      return;
    }

    setIsExecuting(true);
    appendLog('system', 'executing bridge workflow...');

    try {
      const signature = await solanaBridge.bridge({
        walletAddress: publicKey,
        amount: pendingBridge.amount,
        assetSymbol: pendingBridge.asset,
        destinationAddress: pendingBridge.destination,
        overrides: bridgeOverrides,
        callOptions: pendingCall ?? undefined,
        signTransaction,
      });

      appendLog('success', `Bridge submitted :: ${signature}`);
      setRecentSignatures(prev => [signature, ...prev].slice(0, 8));
      setPendingBridge(null);
      setBridgeOverrides(undefined);
      setPendingCall(null);
      setPendingCallMeta(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'bridge transaction failed.';
      appendLog('error', message);
    } finally {
      setIsExecuting(false);
    }
  }, [
    appendLog,
    bridgeOverrides,
    pendingBridge,
    pendingCall,
    publicKey,
    signTransaction,
  ]);

  const printBalances = useCallback(
    async (walletAddress: PublicKey) => {
      try {
        const solBalance = await solanaBridge.getSolBalance(walletAddress);
        appendLog('system', `SOL :: ${solBalance.toFixed(6)} (devnet)`);
      } catch (error) {
        appendLog(
          'error',
          error instanceof Error ? error.message : 'failed to fetch SOL balance.'
        );
        return;
      }

      const splAssets = supportedAssets.filter(
        asset => asset.type === 'spl' && asset.mintAddress
      );

      for (const asset of splAssets) {
        try {
          const mint = new PublicKey(asset.mintAddress!);
          const ata = await getAssociatedTokenAddress(mint, walletAddress);
          const account = await getAccount(connection, ata);
          const formatted = formatUnits(BigInt(account.amount.toString()), asset.decimals);
          appendLog('system', `${asset.symbol.toUpperCase()} :: ${formatted}`);
        } catch {
          appendLog('system', `${asset.symbol.toUpperCase()} :: 0 (no token account yet)`);
        }
      }
    },
    [appendLog, connection, supportedAssets]
  );

  const executeCommand = useCallback(
    async (command: ParsedCommand) => {
      switch (command.type) {
        case 'help':
          printHelp();
          break;
        case 'clear':
          setLogEntries([createLog('system', 'logs cleared')]);
          break;
        case 'assets':
          printAssets();
          break;
        case 'history':
          printHistory();
          break;
        case 'balance':
          if (!publicKey) {
            appendLog('error', 'connect a Solana wallet first.');
            break;
          }
          await runWithLock(async () => {
            await printBalances(publicKey);
          });
          break;
        case 'faucet':
          await runWithLock(async () => {
            await handleFaucet(command.asset);
          });
          break;
        case 'bridge':
          queueBridge(command.payload);
          break;
        case 'bridgecall':
          queueBridgeCall(command.payload);
          break;
        case 'empty':
        default:
          break;
      }
    },
    [
      appendLog,
      handleFaucet,
      printAssets,
      printHelp,
      printHistory,
      printBalances,
      publicKey,
      queueBridge,
      queueBridgeCall,
      runWithLock,
    ]
  );

  const handleCommandBatchExecute = async () => {
    if (isLocked) {
      appendLog('system', 'another command is still running — hold tight.');
      return;
    }

    const commands = commandBatch
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (!commands.length) {
      appendLog('system', 'type one or more commands before executing.');
      return;
    }

    setPendingBridge(null);
    setBridgeOverrides(undefined);
    setPendingCall(null);
    setPendingCallMeta(null);

    let hasBridgeCommand = false;

    for (const line of commands) {
      appendLog('command', line);
      const parsed = parseTerminalCommand(line);
      if (parsed.type === 'empty') {
        continue;
      }
      if (parsed.type === 'error') {
        appendLog('error', parsed.message);
        continue;
      }
      if (parsed.type === 'bridge') {
        hasBridgeCommand = true;
      }
      await executeCommand(parsed);
    }

    if (hasBridgeCommand) {
      await executeQueuedBridge();
    } else {
      appendLog('system', 'commands processed.');
    }

    setCommandBatch('');
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      <section className="bg-black/60 border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10">
        <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs mb-3">
          quick guide
        </h3>
        <ul className="text-green-200 text-sm space-y-1 list-disc list-inside">
          <li>
            `bridge &lt;amount&gt; &lt;asset-or-mint&gt; &lt;base-address&gt; [--mint --remote
            --decimals]`
          </li>
          <li>
            `bridgecall &lt;contract&gt; &lt;function&gt; --args ... --value &lt;eth&gt;` (optional
            second line)
          </li>
          <li>
            Use a Solana mint address instead of `sol` to bridge custom SPL tokens (requires
            `--remote 0x...` for the Base twin).
          </li>
          <li>
            Commands: `balance`, `assets`, `history`, `faucet sol`, `help`, `clear`. Hit Execute to
            send the staged workflow.
          </li>
        </ul>
        {publicKey && (
          <p className="text-green-200 text-xs mt-3">
            Twin (Base):{' '}
            {isTwinLoading
              ? 'resolving…'
              : twinAddress
              ? (
                  <a
                    href={`${BASE_SEPOLIA_CONFIG.blockExplorer}/address/${twinAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-300 underline"
                  >
                    {truncateAddress(twinAddress)}
                  </a>
                )
              : twinError ?? 'unavailable'}
          </p>
        )}
      </section>

      <section className="bg-black/60 border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs">terminal</h3>
          <div className="text-green-200 text-xs">
            {pendingBridge
              ? `staged bridge: ${pendingBridge.amount} ${pendingBridge.asset}`
              : 'no bridge queued'}
          </div>
        </div>
        <textarea
          value={commandBatch}
          onChange={event => setCommandBatch(event.target.value)}
          rows={5}
          spellCheck={false}
          disabled={isLocked}
          placeholder={
            connected
              ? `bridge 0.1 sol 0xabc...
bridgecall 0xcontract transfer --args 0xrecipient 1000000`
              : 'connect a wallet to start bridging'
          }
          className="mt-3 w-full bg-black/80 border border-green-500/40 rounded px-3 py-2 text-green-100 placeholder-green-800 font-mono text-sm focus:outline-none focus:border-green-400 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleCommandBatchExecute}
          disabled={isLocked || isExecuting}
          className="mt-3 inline-flex items-center justify-center bg-green-600/80 hover:bg-green-500 text-black font-semibold px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExecuting ? 'Executing...' : 'Execute'}
        </button>
      </section>

      <section className="bg-black/60 border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs">logs</h3>
          {pendingCallMeta && (
            <span className="text-green-200 text-xs">
              staged call: {pendingCallMeta.functionName} @ {pendingCallMeta.contract}
            </span>
          )}
        </div>
        {logEntries.length === 0 ? (
          <p className="text-green-200 text-sm opacity-70">No logs yet.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {logEntries.map(entry => (
              <li
                key={entry.id}
                className={{
                  system: 'text-green-300/90 text-sm',
                  command: 'text-green-400 text-sm',
                  success: 'text-emerald-300 text-sm',
                  error: 'text-red-300 text-sm',
                }[entry.variant]}
              >
                <span className="text-green-500/70 mr-2 text-xs">{entry.timestamp}</span>
                {entry.content}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
