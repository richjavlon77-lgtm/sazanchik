import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
import { WaiterButton } from "@/components/WaiterButton";
import { CartBar } from "@/components/CartBar";
import { CartProvider } from "@/lib/cart-context";
import { FavoritesProvider } from "@/lib/favorites-context";
import { HashHighlighter } from "@/components/HashHighlighter";
import { IntroSplash } from "@/components/IntroSplash";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sazanchik.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Сазанчик CITY — Меню ресторана",
    template: "%s · Сазанчик CITY",
  },
  description:
    "Ресторан «Сазанчик CITY» в Ташкенте. В лучших традициях узбекской кухни с нотками европейской изысканности. Меню по QR-коду.",
  keywords: [
    "Сазанчик",
    "ресторан Ташкент",
    "узбекская кухня",
    "плов",
    "шашлык",
    "рыба",
    "сазан",
    "меню",
    "QR menu",
    "Tashkent restaurant",
  ],
  authors: [{ name: "Сазанчик CITY" }],
  creator: "Сазанчик CITY",
  publisher: "Сазанчик CITY",
  formatDetection: { telephone: true, address: true, email: true },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    alternateLocale: ["uz_UZ", "en_US"],
    url: siteUrl,
    title: "Сазанчик CITY — Меню ресторана",
    description:
      "Семейный ресторан в Ташкенте. Узбекская кухня с европейскими нотками. Откройте меню по QR-коду.",
    siteName: "Сазанчик CITY",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Сазанчик CITY — Меню",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Сазанчик CITY — Меню ресторана",
    description:
      "Семейный ресторан в Ташкенте. Узбекская кухня с европейскими нотками.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: siteUrl,
    languages: {
      "ru-RU": siteUrl,
      "uz-UZ": siteUrl,
      "en-US": siteUrl,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1611",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col relative">
        <I18nProvider>
          <FavoritesProvider>
            <CartProvider>
              {children}
              <CartBar />
              <WaiterButton />
              <HashHighlighter />
              <IntroSplash />
              <Toaster position="top-center" />
            </CartProvider>
          </FavoritesProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
