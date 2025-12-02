'use client';

import { MainContent } from '../components/MainContent';
import { WalletConnection } from '../components/WalletConnection';
import { useNetwork } from '../contexts/NetworkContext';
import { PROJECT_NAME, PROJECT_TAGLINE } from '../lib/constants';

export default function Home() {
  const { config } = useNetwork();

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
          <WalletConnection />
        </header>

        <MainContent />
      </div>
    </div>
  );
}
