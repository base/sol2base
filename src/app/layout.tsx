import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "../components/WalletProvider";
import { NotificationManager } from "../components/NotificationToast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sol2Base - Solana to Base Bridge",
  description: "Bridge your USDC from Solana Devnet to Base Sepolia using the official Base/Solana bridge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NotificationManager>
          <SolanaWalletProvider>
            {children}
          </SolanaWalletProvider>
        </NotificationManager>
      </body>
    </html>
  );
}
