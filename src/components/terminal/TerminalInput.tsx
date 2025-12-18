import React from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  disabled?: boolean;
  placeholder?: string;
  isExecuting?: boolean;
  onGuide?: () => void;
}

export const TerminalInput: React.FC<Props> = ({
  value,
  onChange,
  onExecute,
  disabled,
  placeholder,
  isExecuting,
  onGuide,
}) => {
  return (
    <section className="bg-black/60 border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-green-300 uppercase tracking-[0.2em] text-xs">terminal</h3>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-3 w-full bg-black/80 border border-green-500/40 rounded px-3 py-2 text-green-100 placeholder-green-800 font-mono text-sm focus:outline-none focus:border-green-400 disabled:opacity-60 min-h-48 sm:min-h-56 lg:min-h-72 resize-vertical"
      />
      <button
        type="button"
        onClick={onExecute}
        disabled={disabled || isExecuting}
        className="mt-3 inline-flex items-center justify-center bg-green-600/80 hover:bg-green-500 text-black font-semibold px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isExecuting ? "Executing..." : "Execute"}
      </button>
      {onGuide && (
        <button
          type="button"
          onClick={onGuide}
          className="mt-2 inline-flex items-center justify-center border border-green-400/60 text-green-200 px-4 py-2 rounded text-sm hover:bg-green-400/10 transition-colors"
        >
          How to use?
        </button>
      )}
    </section>
  );
};

