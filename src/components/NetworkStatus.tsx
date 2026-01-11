'use client';

import React from 'react';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface NetworkStatusProps {
  solanaStatus: ConnectionStatus;
  baseStatus: ConnectionStatus;
  solanaLatency?: number;
  baseLatency?: number;
}

const getStatusColor = (status: ConnectionStatus): string => {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'connecting':
      return 'bg-yellow-500 animate-pulse';
    case 'disconnected':
      return 'bg-gray-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusText = (status: ConnectionStatus): string => {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
};

interface StatusDotProps {
  status: ConnectionStatus;
  label: string;
  latency?: number;
}

const StatusDot: React.FC<StatusDotProps> = ({ status, label, latency }) => (
  <div className="flex items-center gap-2 text-xs">
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}
        aria-label={`${label} status: ${getStatusText(status)}`}
      />
      <span className="text-green-300/80 uppercase tracking-wider text-[10px]">
        {label}
      </span>
    </div>
    {latency !== undefined && status === 'connected' && (
      <span className="text-green-400/60 text-[10px]">
        {latency}ms
      </span>
    )}
  </div>
);

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  solanaStatus,
  baseStatus,
  solanaLatency,
  baseLatency,
}) => {
  const allConnected = solanaStatus === 'connected' && baseStatus === 'connected';
  const hasError = solanaStatus === 'error' || baseStatus === 'error';

  return (
    <div 
      className={`flex items-center gap-4 px-3 py-1.5 rounded-lg border ${
        allConnected 
          ? 'border-green-500/30 bg-green-900/10' 
          : hasError 
            ? 'border-red-500/30 bg-red-900/10'
            : 'border-yellow-500/30 bg-yellow-900/10'
      }`}
      role="status"
      aria-label="Network connection status"
    >
      <StatusDot 
        status={solanaStatus} 
        label="SOL" 
        latency={solanaLatency} 
      />
      <div className="w-px h-4 bg-green-500/20" aria-hidden="true" />
      <StatusDot 
        status={baseStatus} 
        label="BASE" 
        latency={baseLatency} 
      />
    </div>
  );
};

// Hook to monitor network status
export const useNetworkStatus = () => {
  const [solanaStatus, setSolanaStatus] = React.useState<ConnectionStatus>('connecting');
  const [baseStatus, setBaseStatus] = React.useState<ConnectionStatus>('connecting');
  const [solanaLatency, setSolanaLatency] = React.useState<number | undefined>(undefined);
  const [baseLatency, setBaseLatency] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const checkSolana = async () => {
      const start = performance.now();
      try {
        const response = await fetch('https://api.devnet.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getHealth',
          }),
        });
        const latency = Math.round(performance.now() - start);
        if (response.ok) {
          setSolanaStatus('connected');
          setSolanaLatency(latency);
        } else {
          setSolanaStatus('error');
        }
      } catch {
        setSolanaStatus('error');
      }
    };

    const checkBase = async () => {
      const start = performance.now();
      try {
        const response = await fetch('https://sepolia.base.org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_blockNumber',
            params: [],
          }),
        });
        const latency = Math.round(performance.now() - start);
        if (response.ok) {
          setBaseStatus('connected');
          setBaseLatency(latency);
        } else {
          setBaseStatus('error');
        }
      } catch {
        setBaseStatus('error');
      }
    };

    // Initial check
    checkSolana();
    checkBase();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      checkSolana();
      checkBase();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return { solanaStatus, baseStatus, solanaLatency, baseLatency };
};
