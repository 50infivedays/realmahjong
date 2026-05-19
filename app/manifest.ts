import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/config";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description:
      "Free online Mahjong game with AI opponents. Play instantly in your browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#14532d",
    theme_color: "#166534",
    orientation: "any",
    categories: ["games", "entertainment"],
    lang: "en",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
