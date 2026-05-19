import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "RealMahjong privacy policy: no personal data collection, local game processing, and limited analytics. Read how we handle your information.",
  path: "/privacy/",
  keywords: ["realmahjong privacy", "mahjong game privacy policy"],
});

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy/" },
        ])}
      />
      {children}
    </>
  );
}
