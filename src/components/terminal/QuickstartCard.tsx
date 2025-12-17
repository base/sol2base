import React from "react";

interface Props {
  exampleCommand: string;
  projectTagline: string;
  copied: boolean;
  onCopy: () => void;
}

export const QuickstartCard: React.FC<Props> = ({
  exampleCommand,
  projectTagline,
  copied,
  onCopy,
}) => {
  return (
    <section className="bg-black/60 border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10">
      <div className="text-green-200 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs">
            Quickstart example
          </h3>
          <button
            type="button"
            onClick={onCopy}
            className="border border-green-400/60 text-green-200 px-2 py-0.5 rounded text-[11px] hover:bg-green-400/10 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-[11px] text-green-300/80">{projectTagline} — copy and execute this command to test</p>
        <code className="block break-all bg-black/40 border border-green-500/30 rounded p-2 shadow-[0_0_12px_rgba(34,197,94,0.25)]">
          {exampleCommand}
        </code>
        <p className="mt-1 italic text-green-200">
          {projectTagline} while bridging <span className="text-green-100 font-semibold">0.0001 SOL</span> to your Twin
          and immediately transferring the freshly minted WSOL to the zero address.
        </p>
      </div>
    </section>
  );
};

