'use client';

import React, { useState, useCallback } from 'react';

interface CopyableAddressProps {
  /** The full address to display and copy */
  address: string;
  /** Optional label to show before the address */
  label?: string;
  /** Number of characters to show at start and end (default: 6) */
  truncateLength?: number;
  /** Whether to show the full address without truncation */
  showFull?: boolean;
  /** Custom class name for styling */
  className?: string;
  /** Type of address for appropriate styling */
  type?: 'solana' | 'base' | 'generic';
}

export const CopyableAddress: React.FC<CopyableAddressProps> = ({
  address,
  label,
  truncateLength = 6,
  showFull = false,
  className = '',
  type = 'generic',
}) => {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const truncatedAddress = showFull
    ? address
    : `${address.slice(0, truncateLength)}...${address.slice(-truncateLength)}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  }, [address]);

  const getTypeStyles = () => {
    switch (type) {
      case 'solana':
        return 'text-purple-400 hover:text-purple-300';
      case 'base':
        return 'text-blue-400 hover:text-blue-300';
      default:
        return 'text-green-400 hover:text-green-300';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'solana':
        return (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        );
      case 'base':
        return (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {label && (
        <span className="text-green-300/70 text-xs uppercase tracking-wider">
          {label}:
        </span>
      )}
      
      {getTypeIcon() && (
        <span className={`${getTypeStyles()} opacity-60`}>{getTypeIcon()}</span>
      )}
      
      <button
        type="button"
        onClick={handleCopy}
        className={`relative font-mono text-xs ${getTypeStyles()} transition-colors cursor-pointer bg-transparent border-none p-0 group`}
        title={`Click to copy: ${address}`}
        aria-label={`Copy address ${truncatedAddress}`}
      >
        <span className="flex items-center gap-1">
          {truncatedAddress}
          <svg
            className={`w-3 h-3 transition-all ${
              copied ? 'text-emerald-400' : 'opacity-0 group-hover:opacity-100'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {copied ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            )}
          </svg>
        </span>

        {/* Tooltip showing full address */}
        {showTooltip && !showFull && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
            <div className="bg-black/95 border border-green-500/40 rounded px-2 py-1 text-[10px] text-green-200 whitespace-nowrap shadow-lg">
              {address}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-green-500/40" />
            </div>
          </div>
        )}
      </button>

      {copied && (
        <span className="text-emerald-400 text-[10px] animate-fade-in">
          Copied!
        </span>
      )}
    </div>
  );
};

// Utility component for transaction hashes
interface CopyableTxHashProps {
  hash: string;
  explorerUrl?: string;
  network: 'solana' | 'base';
}

export const CopyableTxHash: React.FC<CopyableTxHashProps> = ({
  hash,
  explorerUrl,
  network,
}) => {
  return (
    <div className="inline-flex items-center gap-2">
      <CopyableAddress
        address={hash}
        type={network}
        truncateLength={8}
      />
      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400/60 hover:text-green-300 transition-colors"
          aria-label="View on explorer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}
    </div>
  );
};
