import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bakım ve Takip Paneli — Üretken Yüz Kası Klavyesi",
  description: "Bakım ve Takip Paneli",
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
