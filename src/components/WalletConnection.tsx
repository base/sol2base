'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const WalletConnection: React.FC = () => {
  return (
    <WalletMultiButton className="hacker-button !text-green-500 !bg-black !border-green-500 !text-sm !font-mono !uppercase !tracking-wider !px-4 !py-2.5 !min-w-[120px]" />
  );
};
