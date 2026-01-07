'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface CommandHistoryProps {
  /** Array of past commands */
  commands: string[];
  /** Callback when a command is selected for re-execution */
  onSelectCommand: (command: string) => void;
  /** Maximum number of commands to display */
  maxDisplay?: number;
}

export const CommandHistory: React.FC<CommandHistoryProps> = ({
  commands,
  onSelectCommand,
  maxDisplay = 10,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState('');

  const filteredCommands = commands
    .filter((cmd) => cmd.toLowerCase().includes(filter.toLowerCase()))
    .slice(0, maxDisplay);

  const handleCommandClick = useCallback(
    (command: string) => {
      onSelectCommand(command);
      setIsExpanded(false);
    },
    [onSelectCommand]
  );

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isExpanded]);

  if (commands.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-green-400/70 hover:text-green-300 transition-colors text-xs uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded border border-transparent hover:border-green-500/30"
        aria-label="Toggle command history"
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="hidden sm:inline">History</span>
        <span className="bg-green-500/20 text-green-300 text-[10px] px-1.5 py-0.5 rounded-full">
          {commands.length}
        </span>
      </button>

      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-black/95 border border-green-500/40 rounded-lg shadow-lg shadow-green-500/10 min-w-[300px] max-w-[400px] animate-slide-in">
          <div className="p-3 border-b border-green-500/20">
            <h4 className="text-green-300 uppercase tracking-[0.2em] text-xs mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Command History
            </h4>
            <input
              type="text"
              placeholder="Filter commands..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-black/60 border border-green-500/30 rounded px-2 py-1 text-green-200 text-xs placeholder:text-green-500/40 focus:outline-none focus:border-green-400"
              aria-label="Filter command history"
            />
          </div>

          <ul className="max-h-64 overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <li className="text-green-400/50 text-xs px-2 py-2 text-center">
                No matching commands
              </li>
            ) : (
              filteredCommands.map((command, index) => (
                <li key={`${command}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleCommandClick(command)}
                    className="w-full text-left px-2 py-1.5 text-xs font-mono text-green-200 hover:bg-green-500/10 rounded transition-colors truncate flex items-center gap-2 group"
                    title={command}
                  >
                    <span className="text-green-500/50 text-[10px]">
                      {commands.length - commands.indexOf(command)}
                    </span>
                    <span className="flex-1 truncate">{command}</span>
                    <svg
                      className="w-3 h-3 text-green-400/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="p-2 border-t border-green-500/20">
            <p className="text-green-400/40 text-[10px] text-center">
              Click a command to insert it • Use ↑↓ in terminal
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook to manage command history
export const useCommandHistory = (maxHistory: number = 50) => {
  const [commands, setCommands] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addCommand = useCallback(
    (command: string) => {
      const trimmed = command.trim();
      if (!trimmed) return;
      
      setCommands((prev) => {
        // Avoid duplicates at the top
        if (prev[0] === trimmed) return prev;
        return [trimmed, ...prev].slice(0, maxHistory);
      });
      setHistoryIndex(-1);
    },
    [maxHistory]
  );

  const navigateHistory = useCallback(
    (direction: 'up' | 'down'): string | null => {
      if (commands.length === 0) return null;

      let newIndex = historyIndex;
      if (direction === 'up') {
        newIndex = Math.min(historyIndex + 1, commands.length - 1);
      } else {
        newIndex = Math.max(historyIndex - 1, -1);
      }

      setHistoryIndex(newIndex);
      return newIndex >= 0 ? commands[newIndex] : null;
    },
    [commands, historyIndex]
  );

  const resetNavigation = useCallback(() => {
    setHistoryIndex(-1);
  }, []);

  return {
    commands,
    addCommand,
    navigateHistory,
    resetNavigation,
  };
};
