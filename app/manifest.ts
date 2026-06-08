import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Сазанчик CITY — Меню",
    short_name: "Сазанчик",
    description: "Семейная узбекская кухня. Меню по QR-коду.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1611",
    theme_color: "#1a1611",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    lang: "ru",
    categories: ["food", "lifestyle"],
  };
}
