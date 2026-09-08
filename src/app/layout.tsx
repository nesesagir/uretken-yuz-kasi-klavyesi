import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Üretken Yüz Kası Klavyesi",
  description:
    "Minimum kullanıcı etkileşimiyle güvenilir Türkçe cümle üreten, kişiselleştirilebilir kavram odaklı web-AAC sistemi.",
  applicationName: "Üretken Yüz Kası Klavyesi",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Üretken Yüz Kası Klavyesi",
    description:
      "Minimum hareket, eksiksiz iletişim. Yüz kaslarıyla saniyeler içinde doğal cümleler.",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Üretken Yüz Kası Klavyesi",
    description:
      "Minimum hareket, eksiksiz iletişim. Yüz kaslarıyla saniyeler içinde doğal cümleler.",
  },
  appleWebApp: {
    capable: true,
    title: "Üretken Yüz Kası Klavyesi",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="antialiased">
      <body className="min-h-dvh bg-[#F5F7F8] font-sans text-slate-800 antialiased">{children}</body>
    </html>
  );
}
