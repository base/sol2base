import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "../components/WalletProvider";
import { NotificationManager } from "../components/NotificationToast";
import { NetworkProvider } from "../contexts/NetworkContext";
import { PROJECT_NAME, PROJECT_TAGLINE } from "../lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: `${PROJECT_NAME} — ${PROJECT_TAGLINE}`,
  description: PROJECT_TAGLINE,
  icons: {
    icon: '/bridge-icon.svg',
    shortcut: '/bridge-icon.svg',
    apple: '/bridge-icon.svg',
  },
  openGraph: {
    title: `${PROJECT_NAME} — ${PROJECT_TAGLINE}`,
    description: PROJECT_TAGLINE,
    url: "https://terminallyonchain.xyz",
    siteName: PROJECT_NAME,
    images: [
      {
        url: "/og.png",
        width: 800,
        height: 600,
        alt: "Terminally Onchain Bridge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PROJECT_NAME} — ${PROJECT_TAGLINE}`,
    description: PROJECT_TAGLINE,
    images: ["/og.png"],
  },
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
          <NetworkProvider>
            <SolanaWalletProvider>
              {children}
            </SolanaWalletProvider>
          </NetworkProvider>
        </NotificationManager>
      </body>
    </html>
  );
}
