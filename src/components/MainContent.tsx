"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { encodeFunctionData, createPublicClient, http } from "viem";
import { base as baseMainnet, baseSepolia } from "viem/chains";
import { formatUnits } from "ethers";
import { solanaBridge, type BridgeAssetOverrides } from "../lib/bridge";
import {
  ENVIRONMENT_CHOICES,
  PROJECT_TAGLINE,
  getEnvironmentPreset,
  type BridgeEnvironment,
} from "../lib/constants";
import { useNetwork } from "../contexts/NetworkContext";
import {
  parseTerminalCommand,
  type ParsedCommand,
  type BridgeCommandPayload,
} from "../lib/terminalParser";
import type { BaseContractCall } from "../lib/realBridgeImplementation";

type TerminalVariant = "system" | "command" | "success" | "error";

interface LogEntry {
  id: string;
  variant: TerminalVariant;
  content: string;
  timestamp: string;
}

interface BridgeStage {
  payload: BridgeCommandPayload;
  overrides?: BridgeAssetOverrides;
  call: BaseContractCall | null;
}

const createLog = (variant: TerminalVariant, content: string): LogEntry => ({
  id: `${variant}-${Date.now()}-${Math.random()}`,
  variant,
  content,
  timestamp: new Date().toLocaleTimeString(),
});

const BRIDGE_ABI = [
  {
    name: "getPredictedTwinAddress",
    type: "function",
    stateMutability: "view",
    inputs: [{ internalType: "bytes32", name: "sender", type: "bytes32" }],
    outputs: [{ internalType: "address", name: "", type: "address" }],
  },
] as const;

const toBytes32Hex = (pubkey: PublicKey): `0x${string}` =>
  `0x${Array.from(pubkey.toBytes())
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;

export const MainContent: React.FC = () => {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { config, environment, setEnvironment } = useNetwork();
  
  const [commandBatch, setCommandBatch] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [recentSignatures, setRecentSignatures] = useState<
    { signature: string; environment: BridgeEnvironment }[]
  >([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [pendingBridge, setPendingBridge] =
    useState<BridgeCommandPayload | null>(null);
  const [bridgeOverrides, setBridgeOverrides] = useState<
    BridgeAssetOverrides | undefined
  >(undefined);
  const [pendingCall, setPendingCall] = useState<BaseContractCall | null>(null);
  const [pendingCallMeta, setPendingCallMeta] = useState<{
    contract: string;
    selector: string;
    args: string[];
    value?: string;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [twinAddress, setTwinAddress] = useState<string | null>(null);
  const [exampleCopied, setExampleCopied] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const supportedAssets = solanaBridge.getSupportedAssets();
  const baseClient = useMemo(
    () => {
      const chain = config.base.chainId === baseMainnet.id ? baseMainnet : baseSepolia;
      return createPublicClient({
        chain,
        transport: http(config.base.rpcUrl),
      });
    },
    [config.base]
  );
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const exampleTwinDestination = twinAddress ?? "0xYOUR_TWIN";
  const exampleCommand = `bridge 0.0001 sol ${exampleTwinDestination} --call-contract ${
    config.base.wrappedSOL
  } --call-selector "transfer(address,uint256)" --call-args ${zeroAddress} 100000000000000`;

  const appendLog = useCallback((variant: TerminalVariant, content: string) => {
    setLogEntries((prev) =>
      [createLog(variant, content), ...prev].slice(0, 50)
    );
  }, []);

  const handleExampleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exampleCommand);
      setExampleCopied(true);
    } catch (error) {
      appendLog(
        "error",
        error instanceof Error
          ? `Unable to copy command: ${error.message}`
          : "Unable to copy command."
      );
    }
  }, [appendLog, exampleCommand]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries]);

  useEffect(() => {
    if (!exampleCopied) return;
    const timeout = setTimeout(() => setExampleCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [exampleCopied]);

  useEffect(() => {
    if (!publicKey) {
      setTwinAddress(null);
      return;
    }

    let cancelled = false;

    const resolveTwin = async () => {
      try {
        const sender = toBytes32Hex(publicKey);
        const address = await baseClient.readContract({
          address: config.base.bridge as `0x${string}`,
          abi: BRIDGE_ABI,
          functionName: "getPredictedTwinAddress",
          args: [sender],
        });
        if (!cancelled) {
          setTwinAddress(address as string);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to resolve twin address", error);
          setTwinAddress(null);
        }
      }
    };

    resolveTwin();

    return () => {
      cancelled = true;
    };
  }, [baseClient, config.base.bridge, publicKey]);

  const runWithLock = useCallback(async (action: () => Promise<void>) => {
    setIsLocked(true);
    try {
      await action();
    } finally {
      setIsLocked(false);
    }
  }, []);

  const printHelp = useCallback(() => {
    appendLog("system", PROJECT_TAGLINE);
    appendLog("system", "commands:");
    appendLog(
      "system",
      ' bridge <amount> <asset> <destination> [--mint <mint> --remote <0x..> --decimals <n> --call-contract <addr> --call-selector "transfer(address,uint256)" --call-args <arg1> <arg2> --call-value <eth>]'
    );
    appendLog(
      "system",
      " balance                     show SOL + tracked SPL balances"
    );
    appendLog(
      "system",
      " assets                      list built-in asset shortcuts"
    );
    appendLog(
      "system",
      " faucet sol                  drip SOL from cdp faucet"
    );
    appendLog(
      "system",
      " history                     recent Solana transaction signatures"
    );
    appendLog(
      "system",
      " clear                       reset the terminal output"
    );
    appendLog("system", " help                        display this guide");
  }, [appendLog]);

  const printAssets = useCallback(() => {
    if (!supportedAssets.length) {
      appendLog("system", "no predefined assets — use custom flags.");
      return;
    }
    supportedAssets.forEach((asset) => {
      appendLog(
        "system",
        `${asset.symbol.toUpperCase().padEnd(6)} :: ${asset.label} :: mint=${
          asset.mintAddress ?? "custom"
        } :: remote=${asset.remoteAddress ?? "set via --remote"}`
      );
    });
  }, [appendLog, supportedAssets]);

  const printHistory = useCallback(() => {
    if (recentSignatures.length === 0) {
      appendLog("system", "no bridge transactions yet.");
      return;
    }

    appendLog("system", "recent signatures:");
    recentSignatures.forEach(({ signature, environment: sigEnv }) => {
      const preset = getEnvironmentPreset(sigEnv);
      appendLog(
        "system",
        ` • [${preset.label}] ${preset.solana.blockExplorer}/tx/${signature}${
          preset.solana.explorerTxSuffix ?? ""
        }`
      );
    });
  }, [appendLog, recentSignatures]);

  const handleFaucet = useCallback(
    async (asset: string) => {
      if (asset !== "sol") {
        appendLog("error", "Faucet command rejected: only SOL is supported.");
        return;
      }

      if (environment !== "devnet") {
        appendLog("error", "Faucet command rejected: available only on Solana Devnet.");
        return;
      }

      if (!publicKey) {
        appendLog("error", "Faucet command rejected: wallet not connected.");
        return;
      }

      appendLog("system", "requesting 0.00125 SOL from CDP faucet...");

      try {
        const response = await fetch("/api/faucet/sol", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: publicKey.toBase58() }),
      });

      const data = await response.json();
      if (!response.ok) {
          throw new Error(data.error || "SOL faucet request failed.");
        }

        appendLog(
          "success",
          `faucet success :: ${data.amount} SOL :: explorer ${config.solana.blockExplorer}/tx/${data.transactionHash}${
            config.solana.explorerTxSuffix ?? ""
          }`
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "SOL faucet request failed.";
        appendLog("error", message);
      }
    },
    [appendLog, config.solana, environment, publicKey]
  );

  const encodeCall = useCallback(
    (
      contract: string,
      selector: string,
      args: string[] = [],
      value?: string
    ) => {
      const parsedSelector = selector.trim();
      let fnName = "customCall";
      let params = "";

      const functionPattern =
        /^function\s*(?:([A-Za-z0-9_]+)\s*)?\((.*)\)$/;
      const namedPattern = /^([A-Za-z0-9_]+)\((.*)\)$/;

      const functionMatch = parsedSelector.match(functionPattern);
      if (functionMatch) {
        fnName = functionMatch[1] && functionMatch[1]!.length > 0 ? functionMatch[1]! : fnName;
        params = functionMatch[2] ?? "";
      } else {
        const namedMatch = parsedSelector.match(namedPattern);
        if (!namedMatch) {
          throw new Error(
            'call selector must look like transfer(type1,type2,...) or function transfer(type1,type2,...)'
          );
        }
        fnName = namedMatch[1];
        params = namedMatch[2];
      }

      const types = params
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (types.length !== args.length) {
        throw new Error(
          "number of call args must match function selector inputs."
        );
      }
      const abiItem = {
        name: fnName,
        type: "function" as const,
        stateMutability: value ? "payable" : "nonpayable",
        inputs: types.map((type, idx) => ({ name: `arg${idx}`, type })),
        outputs: [],
      };
      const parsedArgs = args.map((arg, idx) => {
        const type = types[idx];
        if (type === "address") {
          if (!/^0x[a-fA-F0-9]{40}$/.test(arg)) {
            throw new Error(`arg ${idx + 1} must be a valid 0x address.`);
          }
          return arg as `0x${string}`;
        }
        if (type.startsWith("uint") || type.startsWith("int")) {
          if (!/^\d+$/.test(arg)) {
            throw new Error(`arg ${idx + 1} must be numeric for ${type}.`);
          }
          return BigInt(arg);
        }
        if (type === "bytes" || type.startsWith("bytes")) {
          if (!/^0x[0-9a-fA-F]*$/.test(arg)) {
            throw new Error(`arg ${idx + 1} must be hex for ${type}.`);
          }
          return arg as `0x${string}`;
        }
        return arg;
      });
      const data = encodeFunctionData({
        abi: [abiItem],
        functionName: fnName,
        args: parsedArgs,
      });
      return {
        type: "call" as const,
        target: contract,
        value,
        data,
      };
    },
    []
  );

  const queueBridge = useCallback(
    (payload: BridgeCommandPayload): BridgeStage | null => {
      const overrides: BridgeAssetOverrides = {};
      if (payload.flags.mint) {
        overrides.mint = payload.flags.mint;
      }
      if (payload.flags.remote) {
        overrides.remote = payload.flags.remote;
      }
      if (typeof payload.flags.decimals === "number") {
        overrides.decimals = payload.flags.decimals;
      }

      const normalizedOverrides =
        Object.keys(overrides).length > 0 ? overrides : undefined;

      let callOption: BaseContractCall | null = null;
      if (payload.flags.callContract && payload.flags.callSelector) {
        try {
          callOption = encodeCall(
            payload.flags.callContract,
            payload.flags.callSelector,
            payload.flags.callArgs,
            payload.flags.callValue
          );
          setPendingCallMeta({
            contract: payload.flags.callContract,
            selector: payload.flags.callSelector,
            args: payload.flags.callArgs ?? [],
            value: payload.flags.callValue,
          });
        } catch (error) {
          appendLog(
            "error",
            error instanceof Error
              ? error.message
              : "Unable to encode Base contract call."
          );
          return null;
        }
      } else {
        setPendingCallMeta(null);
      }
      setPendingCall(callOption);

      setPendingBridge(payload);
      setBridgeOverrides(normalizedOverrides);

      appendLog(
        "system",
        `bridge staged [${config.label}] :: ${payload.amount} ${payload.asset.toUpperCase()} → ${payload.destination}`
      );

      if (callOption) {
        appendLog(
          "system",
          `attached call :: ${payload.flags.callSelector} @ ${payload.flags.callContract}`
        );
      }
      return {
        payload,
        overrides: normalizedOverrides,
        call: callOption,
      };
    },
    [appendLog, config.label, encodeCall]
  );

  const executeQueuedBridge = useCallback(
    async (stage?: BridgeStage) => {
      if (!publicKey || !signTransaction) {
        appendLog("error", "Execute blocked: wallet not connected.");
        return;
      }

      const bridgePayload = stage?.payload ?? pendingBridge;
      if (!bridgePayload) {
        appendLog("error", "Execute blocked: no bridge command queued.");
        return;
      }

      const overrides = stage?.overrides ?? bridgeOverrides;
      const callOption = stage?.call ?? pendingCall;

      setIsExecuting(true);
      appendLog("system", "executing bridge workflow...");

      try {
        const signature = await solanaBridge.bridge({
          walletAddress: publicKey,
          amount: bridgePayload.amount,
          assetSymbol: bridgePayload.asset,
          destinationAddress: bridgePayload.destination,
          overrides,
          callOptions: callOption ?? undefined,
          signTransaction,
        });

        appendLog("success", `Bridge submitted :: ${signature}`);
        setRecentSignatures((prev) => [{ signature, environment }, ...prev].slice(0, 8));
        setPendingBridge(null);
        setBridgeOverrides(undefined);
        setPendingCall(null);
        setPendingCallMeta(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "bridge transaction failed.";
        appendLog("error", message);
      } finally {
        setIsExecuting(false);
      }
    },
    [
      appendLog,
      bridgeOverrides,
      environment,
      pendingBridge,
      pendingCall,
      publicKey,
      signTransaction,
    ]
  );

  const printBalances = useCallback(
    async (walletAddress: PublicKey) => {
      try {
        const solBalance = await solanaBridge.getSolBalance(walletAddress);
        appendLog("system", `SOL :: ${solBalance.toFixed(6)} (${config.solana.name})`);
      } catch (error) {
        appendLog(
          "error",
          error instanceof Error
            ? error.message
            : "failed to fetch SOL balance."
        );
        return;
      }

      const splAssets = supportedAssets.filter(
        (asset) => asset.type === "spl" && asset.mintAddress
      );

      for (const asset of splAssets) {
        try {
          const mint = new PublicKey(asset.mintAddress!);
          const ata = await getAssociatedTokenAddress(mint, walletAddress);
          const account = await getAccount(connection, ata);
          const formatted = formatUnits(
            BigInt(account.amount.toString()),
            asset.decimals
          );
          appendLog("system", `${asset.symbol.toUpperCase()} :: ${formatted}`);
        } catch {
          appendLog(
            "system",
            `${asset.symbol.toUpperCase()} :: 0 (no token account yet)`
          );
        }
      }
    },
    [appendLog, config.solana.name, connection, supportedAssets]
  );

  const executeCommand = useCallback(
    async (command: ParsedCommand): Promise<boolean> => {
      switch (command.type) {
        case "help":
          printHelp();
          return false;
        case "clear":
          setLogEntries([createLog("system", "logs cleared")]);
          return false;
        case "assets":
          printAssets();
          return false;
        case "history":
          printHistory();
          return false;
        case "balance":
    if (!publicKey) {
            appendLog("error", "connect a Solana wallet first.");
            return false;
          }
          await runWithLock(async () => {
            await printBalances(publicKey);
          });
          return false;
        case "faucet":
          await runWithLock(async () => {
            await handleFaucet(command.asset);
          });
          return false;
        case "bridge":
        case "empty":
        default:
          return false;
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
      runWithLock,
    ]
  );

  const handleCommandBatchExecute = async () => {
    if (isLocked) {
      appendLog("system", "another command is still running — hold tight.");
      return;
    }

    const commands = commandBatch
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!commands.length) {
      appendLog("system", "type one or more commands before executing.");
      return;
    }

    let hasBridgeCommand = false;
    let latestStage: BridgeStage | null = null;

    for (const line of commands) {
      appendLog("command", line);
      const parsed = parseTerminalCommand(line);
      if (parsed.type === "empty") {
        continue;
      }
      if (parsed.type === "error") {
        appendLog("error", parsed.message);
        continue;
      }
      if (parsed.type === "bridge") {
        const stage = queueBridge(parsed.payload);
        if (stage) {
          latestStage = stage;
          hasBridgeCommand = true;
        }
        continue;
      }
      await executeCommand(parsed);
    }

    if (latestStage) {
      await executeQueuedBridge(latestStage);
    } else if (hasBridgeCommand) {
      await executeQueuedBridge();
    } else {
      appendLog("system", "commands processed.");
    }

    setCommandBatch("");
  };

    return (
    <div className="flex-1 flex flex-col space-y-6">
      <section className="bg-black/60 border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs">network</h3>
          <p className="text-xs text-green-300/80">{PROJECT_TAGLINE}</p>
          <p className="text-[11px] text-green-400/80 mt-1">{config.label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ENVIRONMENT_CHOICES.map((option) => {
            const isActive = option.id === environment;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setEnvironment(option.id as BridgeEnvironment)}
                className={`px-3 py-1 text-xs rounded border ${
                  isActive
                    ? "border-green-400 bg-green-500/20 text-green-100"
                    : "border-green-500/40 text-green-300 hover:bg-green-400/10"
                } transition-colors`}
              >
                {option.label}
              </button>
            );
          })}
            </div>
      </section>
      <section className="bg-black/60 border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10">
        <div className="text-green-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs">
              Quickstart example
            </h3>
            <button
              type="button"
              onClick={handleExampleCopy}
              className="border border-green-400/60 text-green-200 px-2 py-0.5 rounded text-[11px] hover:bg-green-400/10 transition-colors"
            >
              {exampleCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-[11px] text-green-300/80">
            {PROJECT_TAGLINE} — copy and execute this command to test
          </p>
          <code className="block break-all bg-black/40 border border-green-500/30 rounded p-2 shadow-[0_0_12px_rgba(34,197,94,0.25)]">
            {exampleCommand}
          </code>
          <p className="mt-1 italic text-green-200">
            {PROJECT_TAGLINE} while bridging <span className="text-green-100 font-semibold">0.0001 SOL</span> to
            your Twin on {config.base.name} and immediately transferring the freshly minted WSOL to the zero
            address.
          </p>
        </div>
      </section>

      {isGuideOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full bg-black/90 border border-green-500/40 rounded-lg p-6 text-green-100 relative">
            <button
              type="button"
              onClick={() => setIsGuideOpen(false)}
              className="absolute top-3 right-3 text-green-200 hover:text-green-100 text-xl"
              aria-label="Close quick guide"
            >
              ×
            </button>
            <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs mb-4">
              quick guide
            </h3>
            <p className="text-xs text-green-300/80 mb-4">{PROJECT_TAGLINE}</p>
            <ul className="text-green-200 text-sm space-y-2 list-disc list-inside mb-4">
              <li>
                <code>bridge &lt;amount&gt; &lt;asset-or-mint&gt; &lt;base-address&gt;</code> with optional
                <code> --mint</code>, <code>--remote</code>, <code>--decimals</code>.
              </li>
              <li>
                Attach Base calls via <code>--call-contract</code>, <code>--call-selector</code>{" "}
                (e.g. <code>&quot;transfer(address,uint256)&quot;</code>), <code>--call-args</code>,{" "}
                <code>--call-value</code>.
              </li>
              <li>
                To bridge SPL tokens, paste the mint instead of <code>sol</code> and set{" "}
                <code>--remote</code> to its Base twin.
              </li>
              <li>
                Your Twin address lives under the wallet button; use it as the destination when piping
                contract calls.
              </li>
              <li>
                Utility commands: <code>balance</code>, <code>assets</code>, <code>history</code>,{" "}
                <code>faucet sol</code>, <code>help</code>, <code>clear</code>.
              </li>
            </ul>
            <p className="text-xs text-green-300/80">
              Need an example? Copy the quickstart snippet above the terminal and hit Execute after connecting
              your Solana wallet.
            </p>
          </div>
        </div>
      )}

      <section className="bg-black/60 border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs">
            terminal
          </h3>
          <div className="text-green-200 text-xs">
            {pendingBridge
              ? `staged bridge (${config.label}): ${pendingBridge.amount} ${pendingBridge.asset}`
              : "no bridge queued"}
          </div>
        </div>
        <textarea
          value={commandBatch}
          onChange={(event) => setCommandBatch(event.target.value)}
          rows={5}
          spellCheck={false}
          disabled={isLocked}
          placeholder={
            connected
              ? `bridge 0.2 sol 0xabc --call-contract 0xdef --call-selector transfer(address,uint256) --call-args 0xrecipient 1000000`
              : "connect a wallet to start bridging"
          }
          className="mt-3 w-full bg-black/80 border border-green-500/40 rounded px-3 py-2 text-green-100 placeholder-green-800 font-mono text-sm focus:outline-none focus:border-green-400 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleCommandBatchExecute}
          disabled={isLocked || isExecuting}
          className="mt-3 inline-flex items-center justify-center bg-green-600/80 hover:bg-green-500 text-black font-semibold px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExecuting ? "Executing..." : "Execute"}
        </button>
        <button
          type="button"
          onClick={() => setIsGuideOpen(true)}
          className="mt-2 inline-flex items-center justify-center border border-green-400/60 text-green-200 px-4 py-2 rounded text-sm hover:bg-green-400/10 transition-colors"
        >
          How to use?
        </button>
      </section>

      <section className="bg-black/60 border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs">
            logs
          </h3>
          {pendingCallMeta && (
            <span className="text-green-200 text-xs">
              staged call: {pendingCallMeta.selector} @{" "}
              {pendingCallMeta.contract}{" "}
              {pendingCallMeta.args.length
                ? `(args: ${pendingCallMeta.args.join(" ")})`
                : ""}
              {pendingCallMeta.value ? ` value: ${pendingCallMeta.value}` : ""}
            </span>
          )}
        </div>
        {logEntries.length === 0 ? (
          <p className="text-green-200 text-sm opacity-70">No logs yet.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {logEntries.map((entry) => (
              <li
                key={entry.id}
                className={
                  {
                    system: "text-green-300/90 text-sm",
                    command: "text-green-400 text-sm",
                    success: "text-emerald-300 text-sm",
                    error: "text-red-300 text-sm",
                  }[entry.variant]
                }
              >
                <span className="text-green-500/70 mr-2 text-xs">
                  {entry.timestamp}
                </span>
                {entry.content}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
