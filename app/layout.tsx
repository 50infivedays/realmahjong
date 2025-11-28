import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://realmahjong.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s | RealMahjong',
    default: 'RealMahjong - Authentic Mahjong Game',
  },
  description: "Play RealMahjong online. A pure frontend authentic Mahjong game with AI opponents. Features automatic sorting, multi-language support, and traditional gameplay.",
  keywords: ["Mahjong", "Mahjong Game", "Browser Game", "麻将", "在线麻将", "free", "free mahjong", "free mahjong games", "real mahjong"],
  authors: [{ name: "RealMahjong Team" }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'RealMahjong',
    description: 'Play authentic Mahjong online against AI.',
    url: '/',
    siteName: 'RealMahjong',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RealMahjong',
    description: 'Authentic Mahjong Game',
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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
