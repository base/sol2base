'use client';

import React, { useState } from 'react';

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Enter'], description: 'Execute command' },
  { keys: ['↑', '↓'], description: 'Navigate command history' },
  { keys: ['Ctrl', 'L'], description: 'Clear terminal logs' },
  { keys: ['Ctrl', 'C'], description: 'Cancel current operation' },
  { keys: ['Tab'], description: 'Auto-complete command' },
  { keys: ['Esc'], description: 'Close modals/dialogs' },
];

export const KeyboardShortcuts: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-green-400/70 hover:text-green-300 transition-colors text-xs uppercase tracking-wider flex items-center gap-1"
        aria-label="Toggle keyboard shortcuts"
        aria-expanded={isExpanded}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <span className="hidden sm:inline">Shortcuts</span>
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-black/95 border border-green-500/40 rounded-lg p-4 shadow-lg shadow-green-500/10 min-w-[240px] animate-slide-in">
          <h4 className="text-green-300 uppercase tracking-[0.2em] text-xs mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
            </svg>
            Keyboard Shortcuts
          </h4>
          <ul className="space-y-2">
            {SHORTCUTS.map((shortcut, index) => (
              <li key={index} className="flex items-center justify-between text-xs">
                <span className="text-green-200/80">{shortcut.description}</span>
                <span className="flex gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <kbd
                      key={keyIndex}
                      className="bg-green-900/30 border border-green-500/40 rounded px-1.5 py-0.5 text-green-300 font-mono text-[10px]"
                    >
                      {key}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-green-400/50 text-[10px] mt-3 pt-2 border-t border-green-500/20">
            Type <kbd className="bg-green-900/30 border border-green-500/30 rounded px-1 text-green-300">help</kbd> for all commands
          </p>
        </div>
      )}
    </div>
  );
};
