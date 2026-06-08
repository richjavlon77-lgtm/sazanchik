/**
 * Pure i18n functions and constants — safe to import in server components.
 * NO "use client" directive.
 */
import type { Locale, Localized } from "@/types/menu";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "ru", label: "RU", flag: "🇷🇺" },
  { code: "uz", label: "UZ", flag: "🇺🇿" },
  { code: "en", label: "EN", flag: "🇬🇧" },
];

export const DEFAULT_LOCALE: Locale = "ru";

export function t(value: Localized, locale: Locale): string {
  return value[locale] || value[DEFAULT_LOCALE] || "";
}

export const UI_STRINGS: Record<string, Localized> = {
  tagline: {
    ru: "Узбекская кухня по-новому",
    uz: "Yangicha o'zbek oshxonasi",
    en: "Uzbek cuisine, reimagined",
  },
  menu: {
    ru: "Меню",
    uz: "Menyu",
    en: "Menu",
  },
  call_waiter: {
    ru: "Позвать официанта",
    uz: "Ofitsiantni chaqirish",
    en: "Call waiter",
  },
  weight: {
    ru: "г",
    uz: "g",
    en: "g",
  },
  currency: {
    ru: "сум",
    uz: "so'm",
    en: "UZS",
  },
  hot: {
    ru: "Хит",
    uz: "Xit",
    en: "Hot",
  },
  new: {
    ru: "Новинка",
    uz: "Yangilik",
    en: "New",
  },
  chef: {
    ru: "От шефа",
    uz: "Shefdan",
    en: "Chef's pick",
  },
  contacts: {
    ru: "Контакты",
    uz: "Aloqalar",
    en: "Contacts",
  },
  search_placeholder: {
    ru: "Найти блюдо…",
    uz: "Taom qidirish…",
    en: "Search the menu…",
  },
  search_no_results: {
    ru: "Ничего не найдено",
    uz: "Hech narsa topilmadi",
    en: "Nothing found",
  },
  search_no_results_hint: {
    ru: "Попробуйте другое слово или сбросьте поиск",
    uz: "Boshqa so'z bilan urinib ko'ring",
    en: "Try another word or clear the search",
  },
  search_clear: {
    ru: "Сбросить",
    uz: "Tozalash",
    en: "Clear",
  },
  search_results: {
    ru: "Найдено",
    uz: "Topildi",
    en: "Found",
  },
  table: {
    ru: "Стол",
    uz: "Stol",
    en: "Table",
  },
  call_waiter_short: {
    ru: "Официант",
    uz: "Ofitsiant",
    en: "Waiter",
  },
  call_waiter_title: {
    ru: "Позвать официанта",
    uz: "Ofitsiantni chaqirish",
    en: "Call the waiter",
  },
  call_waiter_desc: {
    ru: "Официант подойдёт к вашему столу через 1-2 минуты.",
    uz: "Ofitsiant 1-2 daqiqada stolingizga keladi.",
    en: "Your waiter will be at your table in 1-2 minutes.",
  },
  bill_request: {
    ru: "Принести счёт",
    uz: "Hisobni olib kelish",
    en: "Bring the bill",
  },
  water_request: {
    ru: "Принести воду",
    uz: "Suv olib kelish",
    en: "Bring water",
  },
  general_call: {
    ru: "Просто подойти",
    uz: "Shunchaki chaqirish",
    en: "Just come over",
  },
  table_number_prompt: {
    ru: "Укажите номер стола",
    uz: "Stol raqamini kiriting",
    en: "Enter your table number",
  },
  call_sent: {
    ru: "Запрос отправлен",
    uz: "So'rov yuborildi",
    en: "Request sent",
  },
  cancel: {
    ru: "Отмена",
    uz: "Bekor qilish",
    en: "Cancel",
  },
  cart_title: {
    ru: "Мой заказ",
    uz: "Mening buyurtmam",
    en: "My order",
  },
  cart_empty: {
    ru: "Здесь пока пусто. Добавьте блюда из меню — это калькулятор для вашего удобства.",
    uz: "Hozircha bo'sh. Menyudan taom qo'shing — bu hisob-kitob qulayligi uchun.",
    en: "Empty so far. Add dishes from the menu — this is a calculator for your convenience.",
  },
  cart_total: {
    ru: "Итого",
    uz: "Jami",
    en: "Total",
  },
  cart_items: {
    ru: "Позиций",
    uz: "Pozitsiya",
    en: "Items",
  },
  cart_service: {
    ru: "+ 20% обслуживание",
    uz: "+ 20% xizmat haqi",
    en: "+ 20% service",
  },
  cart_clear: {
    ru: "Очистить",
    uz: "Tozalash",
    en: "Clear",
  },
  cart_call_waiter: {
    ru: "Сделать заказ",
    uz: "Buyurtma berish",
    en: "Place order",
  },
  cart_added: {
    ru: "Добавлено в заказ",
    uz: "Buyurtmaga qo'shildi",
    en: "Added to order",
  },
  added: {
    ru: "Добавлено",
    uz: "Qo'shildi",
    en: "Added",
  },
  favorites: {
    ru: "Избранное",
    uz: "Tanlanganlar",
    en: "Favorites",
  },
  favorites_empty: {
    ru: "Пока нет избранного. Нажмите ♥ возле блюда чтобы добавить.",
    uz: "Tanlanganlar hozircha bo'sh. Taom yonidagi ♥ ni bosing.",
    en: "No favorites yet. Tap ♥ next to a dish to add.",
  },
  share: {
    ru: "Поделиться",
    uz: "Ulashish",
    en: "Share",
  },
  copied: {
    ru: "Ссылка скопирована",
    uz: "Havola nusxalandi",
    en: "Link copied",
  },
  our_story: {
    ru: "Наша история",
    uz: "Bizning hikoyamiz",
    en: "Our story",
  },
  read_more: {
    ru: "Читать о нас",
    uz: "Biz haqimizda",
    en: "About us",
  },
  recommended: {
    ru: "К этому хорошо идёт",
    uz: "Bunga yaxshi mos keladi",
    en: "Pairs well with",
  },
  address: {
    ru: "Адрес",
    uz: "Manzil",
    en: "Address",
  },
  hours: {
    ru: "Часы работы",
    uz: "Ish vaqti",
    en: "Working hours",
  },
};

export function formatPrice(price: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(
    locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US"
  ).format(price);
  return `${formatted} ${t(UI_STRINGS.currency, locale)}`;
}
