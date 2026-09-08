import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik — Üretken Yüz Kası Klavyesi",
  description:
    "Bu bildirim, kişisel verilerin nasıl işlendiğini açıklar. Kişisel bilgiler ve oturum kayıtları bu cihazda tutulur.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
