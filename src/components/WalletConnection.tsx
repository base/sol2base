"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { BASE_SEPOLIA_CONFIG } from "../lib/constants";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

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

const truncateAddress = (value: string) =>
  value.length > 10 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;

export const WalletConnection: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [twinAddress, setTwinAddress] = useState<string | null>(null);
  const [twinError, setTwinError] = useState<string | null>(null);
  const [isTwinLoading, setIsTwinLoading] = useState(false);

  const baseClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(BASE_SEPOLIA_CONFIG.rpcUrl),
      }),
    []
  );

  useEffect(() => {
    let cancelled = false;

    if (!publicKey) {
      setTwinAddress(null);
      setTwinError(null);
      setIsTwinLoading(false);
      return;
    }

    const resolveTwin = async () => {
      setIsTwinLoading(true);
      setTwinError(null);
      try {
        const sender = toBytes32Hex(publicKey);
        const address = await baseClient.readContract({
          address: BASE_SEPOLIA_CONFIG.bridge as `0x${string}`,
          abi: BRIDGE_ABI,
          functionName: "getPredictedTwinAddress",
          args: [sender],
        });
        if (!cancelled) {
          setTwinAddress(address as string);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to fetch twin address.";
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

  const twinContent = (() => {
    if (!connected) {
      return null;
    }
    if (isTwinLoading) {
      return <span className="text-green-300">resolving…</span>;
    }
    if (twinAddress) {
      return (
        <a
          href={`${BASE_SEPOLIA_CONFIG.blockExplorer}/address/${twinAddress}`}
          target="_blank"
          rel="noreferrer"
          className="text-green-300 underline"
        >
          {truncateAddress(twinAddress)}
        </a>
      );
    }
    return (
      <span className="text-red-300/80">
        {twinError ?? "twin unavailable"}
      </span>
    );
  })();

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <WalletMultiButton className="hacker-button !text-green-500 !bg-black !border-green-500 !text-sm !font-mono !uppercase !tracking-wider !px-4 !py-2.5 !min-w-[120px]" />
      {connected && (
        <div className="text-green-200 text-xs flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-[0.2em] text-green-400">
              twin
            </span>
            {twinContent}
            <div className="relative group flex items-center">
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-green-400 text-[10px] text-green-200 cursor-pointer select-none"
                aria-label="What is a twin contract?"
                role="button"
                tabIndex={0}
              >
                ?
              </span>
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/90 border border-green-400/60 text-[10px] text-green-100 px-2 py-1 rounded opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none w-48 text-left">
                Twin contracts are deterministic Base contracts tied to your
                Solana wallet.
                <br />
                <br />
                If you&rsquo;re making a contract call with the bridge, that&rsquo;s where the call will originate from.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
