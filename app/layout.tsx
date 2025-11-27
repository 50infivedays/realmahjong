import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | RealMahjong',
    default: 'RealMahjong - Authentic Riichi Mahjong Game',
  },
  description: "Play RealMahjong online. A pure frontend authentic Mahjong game with AI opponents. Features automatic sorting, multi-language support, and traditional gameplay.",
  keywords: ["Mahjong", "Riichi", "Game", "Online", "Browser Game", "React", "Next.js", "RealMahjong"],
  authors: [{ name: "RealMahjong Team" }],
  icons: {
    icon: '/favicon.ico', // Explicitly point to favicon.ico for standard browsers
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'RealMahjong',
    description: 'Play authentic Riichi Mahjong online against AI.',
    url: 'https://realmahjong.vercel.app', // Placeholder URL or user's actual if known, better to omit or put likely one
    siteName: 'RealMahjong',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RealMahjong',
    description: 'Authentic Riichi Mahjong Game',
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
        {children}
      </body>
    </html>
  );
}
