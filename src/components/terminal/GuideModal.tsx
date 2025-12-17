import React from "react";
import type { BridgeAssetConfig } from "../../lib/constants";

interface Props {
  open: boolean;
  onClose: () => void;
  projectTagline: string;
  supportedAssets: BridgeAssetConfig[];
  exampleBridge: string;
}

export const GuideModal: React.FC<Props> = ({
  open,
  onClose,
  projectTagline,
  supportedAssets,
  exampleBridge,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full bg-black/90 border border-green-500/40 rounded-lg p-6 text-green-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-green-200 hover:text-green-100 text-xl"
          aria-label="Close quick guide"
        >
          ×
        </button>
        <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs mb-4">quick guide</h3>
        <p className="text-xs text-green-300/80 mb-4">{projectTagline}</p>
        <ul className="text-green-200 text-sm space-y-2 list-disc list-inside mb-4">
          <li>
            <code>bridge &lt;amount&gt; &lt;asset-or-mint&gt; &lt;base-address&gt;</code> with optional{" "}
            <code> --mint</code>, <code>--remote</code>, <code>--decimals</code>.
          </li>
          <li>
            Example: <code>{exampleBridge}</code> bridges a custom SPL mint by explicitly telling the bridge which
            Solana mint, Base token, and decimals to use.
          </li>
          <li>
            Attach Base calls via <code>--call-contract</code>, <code>--call-selector</code>{" "}
            (e.g. <code>&quot;transfer(address,uint256)&quot;</code>), <code>--call-args</code>,{" "}
            <code>--call-value</code>.
          </li>
          <li>
            To bridge SPL tokens, paste the mint instead of <code>sol</code> and set <code>--remote</code> to its Base
            twin.
          </li>
          <li>
            Need Base remote token for a wrapped SPL token? Run <code>remoteToken &lt;mint&gt;</code> to echo the{" "}
            <code>--remote</code> address.
          </li>
          <li>
            Your Twin address lives under the wallet button; use it as the destination when piping contract calls.
          </li>
          <li>
            Utility commands: <code>balance</code>, <code>assets</code>, <code>history</code>, <code>faucet sol</code>,{" "}
            <code>help</code>, <code>clear</code>.
          </li>
        </ul>
        {supportedAssets.length > 0 && (
          <div className="text-xs text-green-300/80">
            <div className="font-semibold text-green-200 mb-2">Predefined assets</div>
            <ul className="space-y-1">
              {supportedAssets.map((asset) => (
                <li key={asset.symbol}>
                  {asset.symbol.toUpperCase()} — mint: {asset.mintAddress ?? "custom"} — remote:{" "}
                  {asset.remoteAddress ?? "set via --remote"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

