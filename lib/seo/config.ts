/** Central site config for metadata, sitemap, and structured data. */
export const siteConfig = {
  name: "RealMahjong",
  legalName: "RealMahjong",
  tagline: "Free Online Mahjong Game",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://realmahjong.vercel.app",
  contactEmail: "realmahjong@proton.me",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@RealMahjong",
  locale: "en_US",
  alternateLocales: ["zh_CN"] as const,
  defaultOgImage: "/icon.png",
  ogImageWidth: 512,
  ogImageHeight: 512,
  keywords: [
    "mahjong",
    "mahjong game",
    "free mahjong",
    "online mahjong",
    "browser mahjong",
    "mahjong solitaire alternative",
    "play mahjong online",
    "麻将",
    "在线麻将",
    "免费麻将",
    "麻将游戏",
    "四人麻将",
  ],
} as const;

export const siteRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/game/", priority: 0.95, changeFrequency: "weekly" as const },
  { path: "/about/", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contact/", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/privacy/", priority: 0.4, changeFrequency: "yearly" as const },
] as const;
