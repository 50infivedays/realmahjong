import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description:
    "Contact the RealMahjong team for feedback, bug reports, or partnership inquiries. We read every message sent to our support inbox.",
  path: "/contact/",
  keywords: ["realmahjong contact", "mahjong game support"],
});

function getContactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact RealMahjong",
    url: `${siteConfig.url.replace(/\/$/, "")}/contact/`,
    mainEntity: {
      "@type": "Organization",
      name: siteConfig.name,
      email: siteConfig.contactEmail,
      url: siteConfig.url,
    },
  };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={[
          getBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact/" },
          ]),
          getContactPageJsonLd(),
        ]}
      />
      {children}
    </>
  );
}
