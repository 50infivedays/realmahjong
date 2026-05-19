import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "Learn about RealMahjong — a free online Mahjong game built for authentic rules, smooth AI opponents, and instant browser play with no install.",
  path: "/about/",
  keywords: ["about realmahjong", "online mahjong project"],
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about/" },
        ])}
      />
      {children}
    </>
  );
}
