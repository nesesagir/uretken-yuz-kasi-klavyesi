import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dokümantasyon — Üretken Yüz Kası Klavyesi",
  description:
    "Medikal standartlara uygun, güvenli ve yormayan iletişim destek sistemi.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
