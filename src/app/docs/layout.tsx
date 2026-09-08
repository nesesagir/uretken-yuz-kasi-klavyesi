import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dokümantasyon — Üretken Yüz Kası Klavyesi",
  description: "Güvenli ve yormayan bir iletişim destek sistemi.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
