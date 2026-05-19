import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPageMetadata({
  title: "Play Mahjong Online",
  description:
    "Start a free Mahjong game instantly. Four-player table with AI opponents, auto-sort hand, pong, kong, chow, ron, and tsumo — no download, runs in your browser.",
  path: "/game/",
  keywords: [
    "play mahjong now",
    "mahjong vs ai",
    "browser mahjong game",
    "instant mahjong",
  ],
});

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Play Game", path: "/game/" },
        ])}
      />
      {children}
    </>
  );
}
