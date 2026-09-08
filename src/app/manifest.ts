import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Üretken Yüz Kası Klavyesi",
    short_name: "ÜYKK",
    description:
      "Minimum kullanıcı etkileşimiyle güvenilir Türkçe cümle üreten, kişiselleştirilebilir kavram odaklı web-AAC sistemi.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F5F7F8",
    theme_color: "#0D9488",
    lang: "tr",
    categories: ["accessibility", "productivity"],
    icons: [
      {
        src: "/icons/app.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/app.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
