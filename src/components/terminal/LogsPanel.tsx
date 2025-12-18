import React from "react";
import type { LogEntry } from "../../lib/terminalLogs";
import type { BridgeCommandPayload } from "../../lib/terminalParser";

interface PendingCallMeta {
  contract: string;
  selector: string;
  args: string[];
  value?: string;
}

interface Props {
  entries: LogEntry[];
  pendingCallMeta: PendingCallMeta | null;
  pendingBridge: BridgeCommandPayload | null;
  configLabel: string;
}

export const LogsPanel: React.FC<Props> = ({ entries, pendingCallMeta, pendingBridge, configLabel }) => {
  return (
    <section className="bg-black/60 border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs">logs</h3>
        {pendingCallMeta && (
          <span className="text-green-200 text-xs">
            staged call: {pendingCallMeta.selector} @ {pendingCallMeta.contract}{" "}
            {pendingCallMeta.args.length ? `(args: ${pendingCallMeta.args.join(" ")})` : ""}{" "}
            {pendingCallMeta.value ? ` value: ${pendingCallMeta.value}` : ""}
          </span>
        )}
        {pendingBridge && !pendingCallMeta && (
          <span className="text-green-200 text-xs">
            staged bridge ({configLabel}): {pendingBridge.amount} {pendingBridge.asset}
          </span>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="text-green-200 text-sm opacity-70">No logs yet.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {entries.map((entry) => (
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
              <span className="text-green-500/70 mr-2 text-xs">{entry.timestamp}</span>
              {entry.content}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

