import type { Localized } from "@/types/menu";

/**
 * Editorial intros for each category — short evocative text from the chef.
 * Adds storytelling layer above the items themselves.
 */
export const CATEGORY_INTROS: Record<string, Localized> = {
  "cold-starters": {
    ru: "Лёгкое начало вечера — то, что ставят на стол первым. Холодные закуски в нашей традиции — это знакомство.",
    uz: "Kechki ovqatning yengil boshlanishi. Sovuq gazaklar — bu tanishuv.",
    en: "An easy beginning to the evening — what comes to the table first. In our tradition, cold starters are an introduction.",
  },
  salads: {
    ru: "Каждый салат — это маленький натюрморт. Мы режем овощи руками, заправки делаем перед подачей.",
    uz: "Har bir salat — bu kichik natyurmort. Sabzavotlarni qo'l bilan kesamiz, souslarni servisdan oldin tayyorlaymiz.",
    en: "Each salad is a small still life. We hand-cut the vegetables and dress them just before serving.",
  },
  "hot-starters": {
    ru: "Перед главным блюдом — что-то тёплое, чтобы не пропускать ни одного шага трапезы.",
    uz: "Asosiy taomdan oldin — biror issiq narsa. Hech bir bosqichni o'tkazib yubormaslik kerak.",
    en: "Before the main course — something warm, so you don't miss a single step of the meal.",
  },
  soups: {
    ru: "Сваренные на медленном огне, на костях, по узбекским традициям. Шурпа варится 4 часа.",
    uz: "Suyaklarda, sekin olovda — o'zbek an'analari bo'yicha. Sho'rvani 4 soat qaynatamiz.",
    en: "Slow-simmered on the bone, in the Uzbek tradition. Our shurpa cooks for four hours.",
  },
  flatbread: {
    ru: "Тонкое тесто, наполненное мясом, тыквой или сыром с зеленью. Печём в тандыре до золотистой корочки.",
    uz: "Yupqa xamir — go'sht, qovoq yoki ko'kat-pishloq bilan. Tandirda oltinrang qatlamgacha pishiramiz.",
    en: "Thin dough filled with meat, pumpkin or cheese and herbs. Baked in the tandoor until golden.",
  },
  "dough-dishes": {
    ru: "Барак, манты, шават-ош — наследие, которое мы готовим вручную. Каждая складка важна.",
    uz: "Barak, manti, shavat oshi — biz qo'l bilan tayyorlaydigan meros. Har bir burma muhim.",
    en: "Barak, manty, shavat-osh — heritage we make by hand. Every fold matters.",
  },
  "hot-mains": {
    ru: "Главные блюда. То, ради чего стоит остановиться у нас на ужин.",
    uz: "Asosiy taomlar. Bizga kechki ovqatga to'xtab o'tish arziydigan sabab.",
    en: "Mains. The reason to stop by for dinner.",
  },
  "caucasian-grill": {
    ru: "Мангал у нас работает всегда. Маринад секрет шефа, угли — только дубовые.",
    uz: "Mangalimiz doim ishlaydi. Marinada — shefning siri, ko'mir — faqat eman.",
    en: "Our grill runs all day. The marinade is the chef's secret; only oak coals.",
  },
  fish: {
    ru: "Сазан — рыба, давшая имя ресторану. Привозим живой каждое утро из горных прудов.",
    uz: "Sazan — restoranga nom bergan baliq. Har kuni ertalab tog' hovuzlaridan tirik keltiramiz.",
    en: "Sazan — the fish that gave the restaurant its name. Delivered live each morning from mountain ponds.",
  },
  pasta: {
    ru: "Европейская сторона нашей кухни. Соусы делаем с нуля, паста готовится по запросу.",
    uz: "Oshxonamizning yevropacha tomoni. Souslarni noldan tayyorlaymiz.",
    en: "The European side of our kitchen. Sauces made from scratch, pasta cooked to order.",
  },
  steaks: {
    ru: "Мраморная говядина выдержки 21 день. Готовим на каменной плите по запросу — указывайте прожарку официанту.",
    uz: "21 kun saqlangan marmar mol go'shti. Tosh plitada, sizning so'rovingiz bo'yicha.",
    en: "21-day aged marbled beef, cooked on stone to your preferred doneness.",
  },
  sides: {
    ru: "К любому блюду — что-то, что дополнит, не перебивая.",
    uz: "Har qanday taomga — to'ldiruvchi, ammo asosiy ta'mni bezovta qilmaydigan.",
    en: "Whatever main you choose — something to complete it, never overpower.",
  },
  bread: {
    ru: "Хлеб в нашем тандыре печёт человек, который занимается этим тридцать лет.",
    uz: "Tandirimizdagi nonni o'ttiz yildan beri non yopuvchi yopadi.",
    en: "Our tandoor bread is baked by a man who has been doing it for thirty years.",
  },
  waffles: {
    ru: "Бельгийская вафельница на медленном огне. Топпинги выбираете вы.",
    uz: "Belgiya vaflisi sekin olovda. Toppinglarni siz tanlaysiz.",
    en: "Belgian iron, slow flame. You pick the toppings.",
  },
  desserts: {
    ru: "Подаются на двоих или более. Финал ужина должен быть совместным.",
    uz: "Ikki yoki ko'p kishi uchun. Kechki ovqatning yakuni umumiy bo'lishi kerak.",
    en: "Served for two or more. The end of dinner should be shared.",
  },
  coffee: {
    ru: "Зёрна обжаривают в Италии под заказ ресторана. Молоко — местное, козье и коровье.",
    uz: "Donlar Italiyada — restorancha buyurtma asosida qovuriladi. Sut — mahalliy.",
    en: "Beans roasted in Italy to the restaurant's own recipe. Milk is local.",
  },
  tea: {
    ru: "Узбекская традиция в фарфоровых чайниках. Многие чаи завариваем под заказ из цельных листьев.",
    uz: "O'zbek an'anasi chinni choynaklarda. Ko'p choylarni butun barglardan buyurtma asosida damlaymiz.",
    en: "Uzbek tradition in porcelain teapots. Many teas brewed to order from whole leaves.",
  },
  "fresh-drinks": {
    ru: "Фреши делаем при вас — фрукты выбираете глазами.",
    uz: "Freshlarni siz huzuringizda tayyorlaymiz — mevalarni o'zingiz tanlaysiz.",
    en: "Fresh juices made in front of you — pick your fruit by eye.",
  },
  "cold-drinks": {
    ru: "Минеральные воды из узбекских источников и бренды, которые мы доверяем.",
    uz: "O'zbek manbalaridan mineral suvlar va biz ishonadigan brendlar.",
    en: "Uzbek mineral water and the brands we trust.",
  },
};

export function applyIntros<T extends { id: string; intro?: Localized }>(
  categories: T[]
): T[] {
  return categories.map((c) => ({
    ...c,
    intro: c.intro ?? CATEGORY_INTROS[c.id],
  }));
}
