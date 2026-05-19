import type { Metadata } from "next";
import { siteConfig } from "./config";

type PageSeoInput = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  keywords?: string[];
  /** Use full title as-is (avoids title template suffix on homepage) */
  absoluteTitle?: boolean;
  /** Set false for pages that should not appear in search results */
  index?: boolean;
};

export function absoluteUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function createPageMetadata({
  title,
  description,
  path,
  keywords = [],
  absoluteTitle = false,
  index = true,
}: PageSeoInput): Metadata {
  const canonicalPath = path === "/" ? "/" : path.endsWith("/") ? path : `${path}/`;
  const pageTitle = absoluteTitle
    ? title
    : title.includes(siteConfig.name)
      ? title
      : `${title} | ${siteConfig.name}`;
  const ogImage = siteConfig.defaultOgImage;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: {
      canonical: canonicalPath,
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: false,
        },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      alternateLocale: [...siteConfig.alternateLocales],
      url: canonicalPath,
      siteName: siteConfig.name,
      title: pageTitle,
      description,
      images: [
        {
          url: ogImage,
          width: siteConfig.ogImageWidth,
          height: siteConfig.ogImageHeight,
          alt: `${siteConfig.name} — ${siteConfig.tagline}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      title: pageTitle,
      description,
      images: [
        {
          url: ogImage,
          alt: `${siteConfig.name} logo`,
        },
      ],
    },
  };
}

export const defaultSiteMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Play free Mahjong online in your browser. RealMahjong is an authentic 4-player Mahjong game with AI opponents, auto-sort, and traditional pong, kong, chow, ron, and tsumo rules. No download required.",
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: `${siteConfig.name} Team`, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "games",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    alternateLocale: [...siteConfig.alternateLocales],
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description:
      "Play authentic Mahjong online against AI. Free, instant, and runs entirely in your browser.",
    images: [
      {
        url: siteConfig.defaultOgImage,
        width: siteConfig.ogImageWidth,
        height: siteConfig.ogImageHeight,
        alt: `${siteConfig.name} icon`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    title: siteConfig.name,
    description: "Free online Mahjong with AI opponents. Play instantly in your browser.",
    images: [
      {
        url: siteConfig.defaultOgImage,
        alt: `${siteConfig.name} icon`,
      },
    ],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};
