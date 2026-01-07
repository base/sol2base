'use client';

import { MainContent } from '../components/MainContent';
import { WalletConnection } from '../components/WalletConnection';
import { Footer } from '../components/Footer';
import { NetworkStatus, useNetworkStatus } from '../components/NetworkStatus';
import { KeyboardShortcuts } from '../components/terminal/KeyboardShortcuts';
import { useNetwork } from '../contexts/NetworkContext';
import {
  ENVIRONMENT_CHOICES,
  PROJECT_NAME,
  PROJECT_TAGLINE,
  type BridgeEnvironment,
} from '../lib/constants';

export default function Home() {
  const { config, environment, setEnvironment } = useNetwork();
  const { solanaStatus, baseStatus, solanaLatency, baseLatency } = useNetworkStatus();

  return (
    <div className="min-h-screen bg-[#010104] text-[#aaf7c9] font-mono">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col min-h-screen">
        <header className="flex items-center justify-between pb-6 border-b border-green-500/30 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-green-400">{PROJECT_NAME}</p>
            <p className="text-sm text-green-300/80 italic">
              {PROJECT_TAGLINE}
            </p>
            <p className="text-[11px] text-green-400/80 mt-1">
              {config.label}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-end">
            <NetworkStatus
              solanaStatus={solanaStatus}
              baseStatus={baseStatus}
              solanaLatency={solanaLatency}
              baseLatency={baseLatency}
            />
            <label className="text-[11px] uppercase tracking-[0.2em] text-green-300 flex flex-col items-end gap-1">
              <span>network</span>
              <select
                value={environment}
                onChange={(event) => setEnvironment(event.target.value as BridgeEnvironment)}
                className="bg-black/60 border border-green-500/40 rounded px-2 py-1 text-green-100 text-xs focus:outline-none focus:border-green-300"
              >
                {ENVIRONMENT_CHOICES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <KeyboardShortcuts />
            <WalletConnection />
          </div>
        </header>

        <MainContent />
        
        <Footer />
      </div>
    </div>
  );
}
