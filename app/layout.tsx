import type { Metadata, Viewport } from "next";
import { Golos_Text, Geist_Mono, Cormorant } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/components/I18nProvider";
import { ClientChrome } from "@/components/ClientChrome";
import { CartProvider } from "@/lib/cart-context";
import { FavoritesProvider } from "@/lib/favorites-context";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

// Body — Golos Text: Cyrillic-first, crisp UI sans (RU/UZ/EN/TR)
const bodySans = Golos_Text({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display — Cormorant: elegant serif for headings, prices, dish names
const cormorant = Cormorant({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
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
  themeColor: "#fbf9f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${bodySans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        {/* Гостевой сайт — только светлый: forcedTheme перекрывает застрявший
            в localStorage «dark» у гостей со старой (тёмной) версии сайта. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <I18nProvider>
            <FavoritesProvider>
              <CartProvider>
                {children}
                <ClientChrome />
                <Toaster position="top-center" />
                <ServiceWorkerRegister />
              </CartProvider>
            </FavoritesProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
