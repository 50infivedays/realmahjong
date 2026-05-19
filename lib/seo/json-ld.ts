import { siteConfig, siteRoutes } from "./config";
import { absoluteUrl } from "./metadata";

type JsonLd = Record<string, unknown>;

export function getOrganizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.contactEmail,
    logo: absoluteUrl("/icon.png"),
    sameAs: [],
  };
}

export function getWebSiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description:
      "Free browser-based Mahjong game with AI opponents and traditional riichi-style tile rules.",
    inLanguage: ["en-US", "zh-CN"],
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function getWebApplicationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: absoluteUrl("/game/"),
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Play Mahjong online for free against AI opponents with auto-sort, melds, and win detection.",
    image: absoluteUrl("/icon.png"),
    inLanguage: ["en-US", "zh-CN"],
    isAccessibleForFree: true,
  };
}

export function getBreadcrumbJsonLd(
  items: { name: string; path: `/${string}` | "/" }[]
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path === "/" ? "/" : item.path),
    })),
  };
}

export function getGlobalJsonLd(): JsonLd[] {
  return [getOrganizationJsonLd(), getWebSiteJsonLd(), getWebApplicationJsonLd()];
}

export function getSitemapPaths(): string[] {
  return siteRoutes.map((route) => route.path);
}
