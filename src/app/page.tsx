'use client';

import { MainContent } from '../components/MainContent';
import { WalletConnection } from '../components/WalletConnection';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#010104] text-[#aaf7c9] font-mono">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col min-h-screen">
        <header className="flex items-center justify-between pb-6 border-b border-green-500/30 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-green-400">Solase Terminal</p>
            <p className="text-sm text-green-300/80">
              Solana Devnet → Base Sepolia
            </p>
          </div>
          <WalletConnection />
        </header>

        <MainContent />
      </div>
    </div>
  );
}
