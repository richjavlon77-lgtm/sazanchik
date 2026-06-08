import type { Localized } from "@/types/menu";

export type StoryChapter = {
  title: Localized;
  body: Localized;
};

export const STORY: StoryChapter[] = [
  {
    title: {
      ru: "Имя",
      uz: "Nomi",
      en: "The name",
    },
    body: {
      ru: "«Сазанчик» — это маленький сазан. Рыба из узбекских прудов, на которой вырастали наши деды. Имя ресторана — поклон традиции, в которой ничего не должно пропадать впустую: ни рыба, ни хлеб, ни время за столом.",
      uz: "«Sazanchik» — kichik sazan. O'zbek hovuzlaridan kelgan baliq, bobolarimiz o'sgan. Restoran nomi — hech narsa befoyda yo'qolmasligi kerak bo'lgan an'anaga ta'zim.",
      en: "“Sazanchik” means little carp — a fish from Uzbek ponds, the kind our grandfathers grew up on. The restaurant's name is a bow to a tradition where nothing should go to waste: not the fish, not the bread, not the time spent at the table.",
    },
  },
  {
    title: {
      ru: "Кухня",
      uz: "Oshxona",
      en: "The kitchen",
    },
    body: {
      ru: "Мы готовим узбекскую кухню, как готовили её сто лет назад — без полуфабрикатов, без короткого пути. Бульон варится с шести утра, тесто на манты раскатывается руками, мангал растапливается дубом. Европейская часть меню появилась тогда, когда гости стали возвращаться из Италии и Франции, и нам захотелось дать им знакомое — но в нашем исполнении.",
      uz: "Bizning oshxona — yuz yil oldin tayyorlangandek. Tayyor mahsulotlarsiz, qisqartirilgan yo'lsiz. Sho'rva ertalab oltidan qaynaydi, manti xamiri qo'l bilan yoyiladi, mangal eman bilan yoqiladi.",
      en: "We cook Uzbek food the way it was cooked a hundred years ago — no shortcuts, no convenience products. Broth simmers from six in the morning, dough for manty is rolled by hand, the grill is lit with oak.",
    },
  },
  {
    title: {
      ru: "Стол",
      uz: "Dasturxon",
      en: "The table",
    },
    body: {
      ru: "Дастархан — это не просто стол. Это закон узбекского дома: каждый, кто пришёл, — гость. Мы стараемся, чтобы у нас вы чувствовали себя так же. Без спешки. Чай не заканчивается. Хлеб остаётся горячим. На втором заходе вас уже узнают.",
      uz: "Dasturxon — bu shunchaki stol emas. Bu o'zbek uyining qonuni: kim kelsa — mehmon. Biz sizni shu hisda qoldirishga harakat qilamiz.",
      en: "The dastarkhan is not just a table — it is the law of an Uzbek home: anyone who arrives is a guest. We try to make you feel the same way. No rush. Tea never runs out. Bread stays warm. On your second visit, they will recognise you.",
    },
  },
  {
    title: {
      ru: "Шеф",
      uz: "Oshpaz",
      en: "The chef",
    },
    body: {
      ru: "На кухне работают трое: шеф, его брат и человек, который тридцать лет печёт хлеб в тандыре. Они не любят менять рецепты, но любят придумывать новое — поэтому одно блюдо в меню всегда сезонное.",
      uz: "Oshxonada uch kishi: oshpaz, uning ukasi va tandirda o'ttiz yildan beri non yopuvchi.",
      en: "Three people work in the kitchen: the chef, his brother, and a man who has been baking bread in the tandoor for thirty years.",
    },
  },
];
