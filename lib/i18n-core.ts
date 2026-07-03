/**
 * Pure i18n functions and constants — safe to import in server components.
 * NO "use client" directive.
 */
import type { Locale, Localized } from "@/types/menu";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "ru", label: "RU", flag: "🇷🇺" },
  { code: "uz", label: "UZ", flag: "🇺🇿" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "tr", label: "TR", flag: "🇹🇷" },
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
    tr: "Yeniden yorumlanan Özbek mutfağı",
  },
  menu: {
    ru: "Меню",
    uz: "Menyu",
    en: "Menu",
    tr: "Menü",
  },
  call_waiter: {
    ru: "Позвать официанта",
    uz: "Ofitsiantni chaqirish",
    en: "Call waiter",
    tr: "Garsonu çağır",
  },
  weight: {
    ru: "г",
    uz: "g",
    en: "g",
    tr: "g",
  },
  currency: {
    ru: "сум",
    uz: "so'm",
    en: "UZS",
    tr: "som",
  },
  hot: {
    ru: "Хит",
    uz: "Xit",
    en: "Hot",
    tr: "Popüler",
  },
  new: {
    ru: "Новинка",
    uz: "Yangilik",
    en: "New",
    tr: "Yeni",
  },
  chef: {
    ru: "От шефа",
    uz: "Shefdan",
    en: "Chef's pick",
    tr: "Şeften",
  },
  contacts: {
    ru: "Контакты",
    uz: "Aloqalar",
    en: "Contacts",
    tr: "İletişim",
  },
  search_placeholder: {
    ru: "Найти блюдо…",
    uz: "Taom qidirish…",
    en: "Search the menu…",
    tr: "Yemek ara…",
  },
  search_no_results: {
    ru: "Ничего не найдено",
    uz: "Hech narsa topilmadi",
    en: "Nothing found",
    tr: "Hiçbir şey bulunamadı",
  },
  search_no_results_hint: {
    ru: "Попробуйте другое слово или сбросьте поиск",
    uz: "Boshqa so'z bilan urinib ko'ring",
    en: "Try another word or clear the search",
    tr: "Başka bir kelime deneyin veya aramayı temizleyin",
  },
  search_clear: {
    ru: "Сбросить",
    uz: "Tozalash",
    en: "Clear",
    tr: "Temizle",
  },
  search_results: {
    ru: "Найдено",
    uz: "Topildi",
    en: "Found",
    tr: "Bulundu",
  },
  table: {
    ru: "Стол",
    uz: "Stol",
    en: "Table",
    tr: "Masa",
  },
  call_waiter_short: {
    ru: "Официант",
    uz: "Ofitsiant",
    en: "Waiter",
    tr: "Garson",
  },
  call_waiter_title: {
    ru: "Позвать официанта",
    uz: "Ofitsiantni chaqirish",
    en: "Call the waiter",
    tr: "Garsonu çağır",
  },
  call_waiter_desc: {
    ru: "Официант подойдёт к вашему столу через 1-2 минуты.",
    uz: "Ofitsiant 1-2 daqiqada stolingizga keladi.",
    en: "Your waiter will be at your table in 1-2 minutes.",
    tr: "Garson 1-2 dakika içinde masanıza gelecek.",
  },
  bill_request: {
    ru: "Принести счёт",
    uz: "Hisobni olib kelish",
    en: "Bring the bill",
    tr: "Hesabı getir",
  },
  water_request: {
    ru: "Принести воду",
    uz: "Suv olib kelish",
    en: "Bring water",
    tr: "Su getir",
  },
  general_call: {
    ru: "Просто подойти",
    uz: "Shunchaki chaqirish",
    en: "Just come over",
    tr: "Sadece gel",
  },
  table_number_prompt: {
    ru: "Укажите номер стола",
    uz: "Stol raqamini kiriting",
    en: "Enter your table number",
    tr: "Masa numaranızı girin",
  },
  call_sent: {
    ru: "Запрос отправлен",
    uz: "So'rov yuborildi",
    en: "Request sent",
    tr: "Talep gönderildi",
  },
  cancel: {
    ru: "Отмена",
    uz: "Bekor qilish",
    en: "Cancel",
    tr: "İptal",
  },
  cart_title: {
    ru: "Мой заказ",
    uz: "Mening buyurtmam",
    en: "My order",
    tr: "Siparişim",
  },
  cart_empty: {
    ru: "Здесь пока пусто. Добавьте блюда из меню — это калькулятор для вашего удобства.",
    uz: "Hozircha bo'sh. Menyudan taom qo'shing — bu hisob-kitob qulayligi uchun.",
    en: "Empty so far. Add dishes from the menu — this is a calculator for your convenience.",
    tr: "Şimdilik boş. Menüden yemek ekleyin — bu, rahatlığınız için bir hesaplayıcıdır.",
  },
  cart_total: {
    ru: "Итого",
    uz: "Jami",
    en: "Total",
    tr: "Toplam",
  },
  cart_items: {
    ru: "Позиций",
    uz: "Pozitsiya",
    en: "Items",
    tr: "Ürün",
  },
  cart_service: {
    ru: "+ 20% обслуживание",
    uz: "+ 20% xizmat haqi",
    en: "+ 20% service",
    tr: "+ %20 servis",
  },
  cart_clear: {
    ru: "Очистить",
    uz: "Tozalash",
    en: "Clear",
    tr: "Temizle",
  },
  cart_call_waiter: {
    ru: "Сделать заказ",
    uz: "Buyurtma berish",
    en: "Place order",
    tr: "Sipariş ver",
  },
  cart_added: {
    ru: "Добавлено в заказ",
    uz: "Buyurtmaga qo'shildi",
    en: "Added to order",
    tr: "Siparişe eklendi",
  },
  added: {
    ru: "Добавлено",
    uz: "Qo'shildi",
    en: "Added",
    tr: "Eklendi",
  },
  favorites: {
    ru: "Избранное",
    uz: "Tanlanganlar",
    en: "Favorites",
    tr: "Favoriler",
  },
  favorites_empty: {
    ru: "Пока нет избранного. Нажмите ♥ возле блюда чтобы добавить.",
    uz: "Tanlanganlar hozircha bo'sh. Taom yonidagi ♥ ni bosing.",
    en: "No favorites yet. Tap ♥ next to a dish to add.",
    tr: "Henüz favori yok. Eklemek için yemeğin yanındaki ♥ simgesine dokunun.",
  },
  share: {
    ru: "Поделиться",
    uz: "Ulashish",
    en: "Share",
    tr: "Paylaş",
  },
  copied: {
    ru: "Ссылка скопирована",
    uz: "Havola nusxalandi",
    en: "Link copied",
    tr: "Bağlantı kopyalandı",
  },
  our_story: {
    ru: "Наша история",
    uz: "Bizning hikoyamiz",
    en: "Our story",
    tr: "Hikayemiz",
  },
  read_more: {
    ru: "Читать о нас",
    uz: "Biz haqimizda",
    en: "About us",
    tr: "Hakkımızda",
  },
  recommended: {
    ru: "К этому хорошо идёт",
    uz: "Bunga yaxshi mos keladi",
    en: "Pairs well with",
    tr: "Yanında iyi gider",
  },
  address: {
    ru: "Адрес",
    uz: "Manzil",
    en: "Address",
    tr: "Adres",
  },
  hours: {
    ru: "Часы работы",
    uz: "Ish vaqti",
    en: "Working hours",
    tr: "Çalışma saatleri",
  },
};

export function formatPrice(price: number, locale: Locale): string {
  const intlLocale =
    locale === "ru"
      ? "ru-RU"
      : locale === "uz"
        ? "uz-UZ"
        : locale === "tr"
          ? "tr-TR"
          : "en-US";
  const formatted = new Intl.NumberFormat(intlLocale).format(price);
  return `${formatted} ${t(UI_STRINGS.currency, locale)}`;
}
