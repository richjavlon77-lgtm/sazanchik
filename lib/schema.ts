import type { MenuCategory } from "@/types/menu";
import { RESTAURANT } from "@/data/restaurant";
import { t } from "@/lib/i18n-core";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sazanchik.vercel.app";

export function buildRestaurantSchema(menu: MenuCategory[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": SITE_URL,
    name: RESTAURANT.name,
    description: t(RESTAURANT.tagline, "ru"),
    url: SITE_URL,
    image: `${SITE_URL}/og-image.png`,
    logo: `${SITE_URL}/logo.svg`,
    telephone: RESTAURANT.phone,
    priceRange: "$$$",
    servesCuisine: ["Uzbek", "European", "Caucasian", "Fish"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tashkent",
      addressCountry: "UZ",
      streetAddress: t(RESTAURANT.address, "ru"),
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "10:00",
        closes: "23:00",
      },
    ],
    sameAs: [`https://instagram.com/${RESTAURANT.instagram.replace("@", "")}`],
    hasMenu: {
      "@type": "Menu",
      "@id": `${SITE_URL}#menu`,
      name: "Меню Сазанчик CITY",
      inLanguage: ["ru", "uz", "en"],
      hasMenuSection: menu.map((cat) => ({
        "@type": "MenuSection",
        "@id": `${SITE_URL}#${cat.id}`,
        name: t(cat.name, "ru"),
        hasMenuItem: cat.items.map((item) => {
          const flatPrice =
            typeof item.price === "number"
              ? item.price
              : Array.isArray(item.price) && item.price[0]
              ? item.price[0].price
              : 0;
          return {
            "@type": "MenuItem",
            "@id": `${SITE_URL}/#dish-${item.id}`,
            name: t(item.name, "ru"),
            description: item.description ? t(item.description, "ru") : undefined,
            offers: {
              "@type": "Offer",
              price: flatPrice,
              priceCurrency: "UZS",
              availability: "https://schema.org/InStock",
            },
          };
        }),
      })),
    },
  };
}

export function buildBreadcrumbSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Меню",
        item: SITE_URL,
      },
    ],
  };
}
