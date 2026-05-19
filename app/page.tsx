import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { siteConfig } from "@/lib/seo/config";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  absoluteTitle: true,
  description:
    "Play free Mahjong online in your browser. RealMahjong offers authentic 4-player Mahjong with AI opponents, auto-sort, pong, kong, chow, ron, and tsumo — no download required.",
  path: "/",
  keywords: ["real mahjong", "mahjong online free", "play mahjong browser"],
});

export default function HomePage() {
  return <HomeClient />;
}
