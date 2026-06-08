import type { MenuCategory } from "@/types/menu";

export const MENU: MenuCategory[] = [
  // ============ ХОЛОДНЫЕ ЗАКУСКИ ============
  {
    id: "cold-starters",
    name: {
      ru: "Холодные закуски",
      uz: "Sovuq gazaklar",
      en: "Cold starters",
    },
    items: [
      {
        id: "myasnoe-assorti",
        image: "/images/myasnoe-assorti.jpg",
        name: { ru: "Мясное ассорти", uz: "Go'sht assorti", en: "Meat platter" },
        description: {
          ru: "Язык говяжий, казы, куриный рулет, говядина пряная",
          uz: "Mol tili, qazi, tovuq ruleti, ziravorli mol go'shti",
          en: "Beef tongue, kazy, chicken roll, spiced beef",
        },
        price: 280000,
      },
      {
        id: "svezhee-assorti",
        image: "/images/svezhee-assorti.jpg",
        name: { ru: "Свежее ассорти", uz: "Tarvuz assorti", en: "Fresh platter" },
        description: {
          ru: "Помидоры, огурцы, перец, зелень",
          uz: "Pomidor, bodring, qalampir, ko'kat",
          en: "Tomatoes, cucumbers, peppers, herbs",
        },
        price: 85000,
      },
      {
        id: "malosolnye-pomidory",
        image: "/images/malosolnye-pomidory.jpg",
        name: {
          ru: "Малосольные помидоры",
          uz: "Tuzlangan pomidor",
          en: "Lightly salted tomatoes",
        },
        description: {
          ru: "Трёхлитровая (для пол-литра)",
          uz: "Uch litrlik (yarim litr uchun)",
          en: "From a 3L jar (half-liter portion)",
        },
        price: 62000,
      },
      {
        id: "brynza-s-zelenyu",
        image: "/images/brynza-s-zelenyu.jpg",
        name: {
          ru: "Брынза с зеленью",
          uz: "Ko'katli pishloq",
          en: "Brynza with herbs",
        },
        price: 50000,
      },
      {
        id: "limon",
        image: "/images/limon.jpg",
        name: { ru: "Лимон", uz: "Limon", en: "Lemon" },
        price: 25000,
      },
      {
        id: "syuzma",
        image: "/images/syuzma.jpg",
        name: { ru: "Сюзьма", uz: "Suzma", en: "Suzma (strained yogurt)" },
        price: 35000,
      },
      {
        id: "rulety-baklazhan",
        image: "/images/rulety-baklazhan.jpg",
        name: {
          ru: "Рулеты из баклажан",
          uz: "Baqlajon ruleti",
          en: "Eggplant rolls",
        },
        description: {
          ru: "С креметой и помидорами",
          uz: "Krem va pomidor bilan",
          en: "With cremeta cheese and tomatoes",
        },
        price: 80000,
      },
      {
        id: "izhan",
        name: { ru: "Иджан", uz: "Ijan", en: "Ijan" },
        price: 75000,
      },
    ],
  },

  // ============ САЛАТЫ ============
  {
    id: "salads",
    name: { ru: "Салаты", uz: "Salatlar", en: "Salads" },
    items: [
      {
        id: "salad-yazyk",
        image: "/images/salad-yazyk.jpg",
        name: {
          ru: "Салат с говяжьим языком",
          uz: "Mol tilli salat",
          en: "Beef tongue salad",
        },
        description: {
          ru: "Отварной говяжий язык, огурец, шампиньоны, корейская морковь",
          uz: "Qaynatilgan mol tili, bodring, qo'ziqorin, koreyscha sabzi",
          en: "Boiled beef tongue, cucumber, mushrooms, Korean carrot",
        },
        price: 110000,
      },
      {
        id: "salad-mozzarella",
        image: "/images/salad-mozzarella.jpg",
        name: {
          ru: "Салат с моцареллой и кедровыми орешками",
          uz: "Motsarella va qarag'ay yong'oqli salat",
          en: "Mozzarella & pine nuts salad",
        },
        price: 85000,
      },
      {
        id: "hrustyashie-baklazhany",
        image: "/images/hrustyashie-baklazhany.jpg",
        name: {
          ru: "Хрустящие баклажаны с помидорами",
          uz: "Pomidorli qarsillama baqlajon",
          en: "Crispy eggplants with tomatoes",
        },
        price: 80000,
      },
      {
        id: "beef-stew-salad",
        image: "/images/beef-stew-salad.jpg",
        name: { ru: "Beef stew", uz: "Beef stew", en: "Beef stew" },
        price: 90000,
      },
      {
        id: "salad-achichuk",
        image: "/images/salad-achichuk.jpg",
        name: { ru: "Салат «Ачичук»", uz: "«Achchiqchuchuk» salat", en: "Achichuk salad" },
        description: {
          ru: "Помидоры, огурец, лук",
          uz: "Pomidor, bodring, piyoz",
          en: "Tomatoes, cucumber, onion",
        },
        price: 38000,
      },
      {
        id: "salad-grecheskiy",
        image: "/images/salad-grecheskiy.jpg",
        name: { ru: "Салат «Греческий»", uz: "«Yunon» salati", en: "Greek salad" },
        description: {
          ru: "Помидоры, огурцы, болгарский перец, оливки, фета-сыр, маслины",
          uz: "Pomidor, bodring, bulg'ori qalampir, zaytun, feta",
          en: "Tomatoes, cucumbers, bell peppers, olives, feta",
        },
        price: 75000,
      },
      {
        id: "salad-caesar",
        image: "/images/salad-caesar.jpg",
        name: { ru: "Цезарь с курицей", uz: "Tovuqli «Tsezar»", en: "Caesar with chicken" },
        description: {
          ru: "Айсберг, куриная грудка, пармезан, гренки, соус цезарь",
          uz: "Aysberg, tovuq, parmezan, krutonlar, sezar sousi",
          en: "Iceberg, chicken breast, parmesan, croutons, Caesar dressing",
        },
        price: 110000,
      },
      {
        id: "steak-salad",
        image: "/images/steak-salad.jpg",
        name: { ru: "Стейк-салат", uz: "Steyk-salat", en: "Steak salad" },
        price: 145000,
      },
      {
        id: "salad-burrata",
        image: "/images/salad-burrata.jpg",
        name: {
          ru: "Салат буррата с томатами",
          uz: "Pomidorli burata salati",
          en: "Burrata salad with tomatoes",
        },
        description: {
          ru: "Буррата, помидоры, рукола, заправка из оливкового масла и базилика",
          uz: "Burata, pomidor, rukkola, zaytun va rayhonli sous",
          en: "Burrata, tomatoes, arugula, olive oil & basil dressing",
        },
        price: 120000,
      },
      {
        id: "salad-tuna",
        image: "/images/salad-tuna.jpg",
        name: { ru: "Салат «С тунцом»", uz: "Tunets salati", en: "Tuna salad" },
        description: {
          ru: "Тунец, айсберг, помидоры, огурец, перец, оливки",
          uz: "Tunets, aysberg, pomidor, bodring, qalampir, zaytun",
          en: "Tuna, iceberg, tomatoes, cucumber, peppers, olives",
        },
        price: 125000,
      },
      {
        id: "salad-caprese",
        image: "/images/salad-caprese.jpg",
        name: { ru: "Салат «Капрезе»", uz: "«Kaprese» salati", en: "Caprese salad" },
        description: {
          ru: "Спелые помидоры, моцарелла, базилик, оливковое масло, бальзамик",
          uz: "Pomidor, motsarella, rayhon, zaytun moyi, balzamik",
          en: "Ripe tomatoes, mozzarella, basil, olive oil, balsamic",
        },
        price: 95000,
      },
      {
        id: "salad-tsum",
        image: "/images/salad-tsum.jpg",
        name: { ru: "Салат «Цум»", uz: "«Tsum» salati", en: "Tsum salad" },
        description: {
          ru: "Лёгкий мясной микс, помидоры, перец, огурец, зелень",
          uz: "Yengil go'shtli mix, pomidor, qalampir, bodring",
          en: "Light meat mix, tomatoes, peppers, cucumber, herbs",
        },
        price: 112000,
      },
      {
        id: "salad-armyanskiy",
        image: "/images/salad-armyanskiy.jpg",
        name: { ru: "Салат армянский", uz: "Arman salati", en: "Armenian salad" },
        description: {
          ru: "Овощи, зелень, грецкий орех, гранат, заправка",
          uz: "Sabzavotlar, ko'kat, yong'oq, anor",
          en: "Vegetables, herbs, walnut, pomegranate, dressing",
        },
        price: 85000,
      },
      {
        id: "salad-aristokrat",
        image: "/images/salad-aristokrat.jpg",
        name: { ru: "Салат «Аристократ»", uz: "«Aristokrat» salati", en: "Aristocrat salad" },
        price: 110000,
      },
      {
        id: "salad-bonfile",
        image: "/images/salad-bonfile.jpg",
        name: { ru: "Салат «Бонфиле»", uz: "«Bonfile» salati", en: "Bonfile salad" },
        description: {
          ru: "Бонфиле говядины, овощи, обжаренные грибы, корейская заправка",
          uz: "Mol bonfilesi, sabzavot, qo'ziqorin, koreyscha sous",
          en: "Beef tenderloin, vegetables, fried mushrooms, Korean dressing",
        },
        price: 175000,
      },
      {
        id: "salad-tuna-deluxe",
        image: "/images/salad-tuna-deluxe.jpg",
        name: { ru: "Салат с тунцом «Делюкс»", uz: "Tunetsli «Deluxe» salat", en: "Tuna Deluxe salad" },
        price: 180000,
      },
      {
        id: "salad-chicken-veg",
        image: "/images/salad-chicken-veg.jpg",
        name: {
          ru: "Салат «Курица-овощи»",
          uz: "«Tovuq-sabzavot» salati",
          en: "Chicken & vegetables salad",
        },
        description: {
          ru: "Курица, баклажан, помидор черри, кунжут, соевая заправка",
          uz: "Tovuq, baqlajon, pomidor, kunjut, soya sousi",
          en: "Chicken, eggplant, cherry tomatoes, sesame, soy dressing",
        },
        price: 120000,
      },
      {
        id: "salad-yagodnyi",
        image: "/images/salad-yagodnyi.jpg",
        name: { ru: "Салат ягодный", uz: "Mevali salat", en: "Berry salad" },
        description: {
          ru: "Рукола, ягоды, козий сыр, кедровые орешки, малиновый соус",
          uz: "Rukkola, mevalar, echki pishlog'i, qarag'ay yong'og'i",
          en: "Arugula, berries, goat cheese, pine nuts, raspberry sauce",
        },
        price: 80000,
      },
      {
        id: "salad-khanskiy",
        image: "/images/salad-khanskiy.jpg",
        name: { ru: "Салат «Ханский»", uz: "«Xon» salati", en: "Khan's salad" },
        description: {
          ru: "Драники, рукола, телячий язык, помидоры черри, оливки, корнишоны",
          uz: "Kartoshka kuki, rukkola, mol tili, pomidor, zaytun, kornichon",
          en: "Potato latkes, arugula, veal tongue, cherry tomatoes, olives, gherkins",
        },
        price: 154000,
      },
      {
        id: "salad-rucola-pomegranate",
        image: "/images/salad-rucola-pomegranate.jpg",
        name: {
          ru: "Рукола с гранатовым соком",
          uz: "Anor sharbatli rukkola",
          en: "Arugula with pomegranate",
        },
        description: {
          ru: "Рукола, грана падано, гранатовый соус, оливковое масло",
          uz: "Rukkola, grana padano, anor sousi, zaytun moyi",
          en: "Arugula, grana padano, pomegranate sauce, olive oil",
        },
        price: 97000,
      },
      {
        id: "salad-orange",
        name: {
          ru: "Салат апельсиновый",
          uz: "Apelsinli salat",
          en: "Orange salad",
        },
        price: 80000,
      },
    ],
  },

  // ============ ГОРЯЧИЕ ЗАКУСКИ ============
  {
    id: "hot-starters",
    name: { ru: "Горячие закуски", uz: "Issiq gazaklar", en: "Hot starters" },
    items: [
      {
        id: "dolma-leaves",
        image: "/images/dolma-leaves.jpg",
        name: {
          ru: "Долма из виноградных листьев",
          uz: "Uzum bargli dolma",
          en: "Vine leaf dolma",
        },
        description: { ru: "5 шт.", uz: "5 dona", en: "5 pcs" },
        price: 75000,
      },
      {
        id: "beef-tongue-butter",
        image: "/images/beef-tongue-butter.jpg",
        name: {
          ru: "Язык говяжий в сливочном масле",
          uz: "Sariyog'da mol tili",
          en: "Beef tongue in butter",
        },
        price: 150000,
      },
      {
        id: "ushok-barak-fried",
        image: "/images/ushok-barak-fried.jpg",
        name: {
          ru: "Ушок барак жареный",
          uz: "Qovurilgan ushoq barak",
          en: "Fried ushok barak",
        },
        price: 55000,
      },
      {
        id: "chicken-wings-bbq",
        image: "/images/chicken-wings-bbq.jpg",
        name: { ru: "Куриные крылышки BBQ", uz: "BBQ tovuq qanotlari", en: "BBQ chicken wings" },
        description: {
          ru: "Куриные крылышки, соус барбекю, кунжут, перец чили",
          uz: "Tovuq qanotlari, barbekyu sousi, kunjut",
          en: "Chicken wings, BBQ sauce, sesame, chili",
        },
        price: 80000,
      },
      {
        id: "shur-kabob-beef",
        name: { ru: "Шур кабоб (говядина)", uz: "Shur kabob (mol)", en: "Shur kabob (beef)" },
        description: { ru: "1 кг", uz: "1 kg", en: "1 kg" },
        price: 125000,
      },
    ],
  },

  // ============ ПЕРВЫЕ БЛЮДА ============
  {
    id: "soups",
    name: { ru: "Первые блюда", uz: "Sho'rvalar", en: "Soups" },
    items: [
      {
        id: "uch-oshi",
        image: "/images/uch-oshi.jpg",
        name: { ru: "Уч оши", uz: "Uch oshi", en: "Uch oshi" },
        price: [
          { label: { ru: "малая", uz: "kichik", en: "small" }, price: 35000 },
          { label: { ru: "большая", uz: "katta", en: "large" }, price: 50000 },
        ],
      },
      {
        id: "uch-oshi-ayran",
        image: "/images/uch-oshi-ayran.jpg",
        name: {
          ru: "Уч оши с айраном",
          uz: "Ayronli uch oshi",
          en: "Uch oshi with ayran",
        },
        price: [
          { label: { ru: "малая", uz: "kichik", en: "small" }, price: 40000 },
          { label: { ru: "большая", uz: "katta", en: "large" }, price: 55000 },
        ],
      },
      {
        id: "ushok-barak-soup",
        image: "/images/ushok-barak-soup.jpg",
        name: { ru: "Ушок барак", uz: "Ushoq barak", en: "Ushok barak" },
        price: [
          { label: { ru: "малая", uz: "kichik", en: "small" }, price: 40000 },
          { label: { ru: "большая", uz: "katta", en: "large" }, price: 55000 },
        ],
      },
      {
        id: "lentil-soup",
        image: "/images/lentil-soup.jpg",
        name: { ru: "Чечевичный суп", uz: "Mosh sho'rva", en: "Lentil soup" },
        price: 60000,
      },
      {
        id: "chicken-soup",
        image: "/images/chicken-soup.jpg",
        name: { ru: "Куриный суп", uz: "Tovuq sho'rva", en: "Chicken soup" },
        price: 55000,
      },
      {
        id: "pelmeni-home",
        name: { ru: "Домашние пельмени", uz: "Uy chuchvarasi", en: "Homemade pelmeni" },
        price: 70000,
      },
    ],
  },

  // ============ КАТЫРМА / ГУММА / ИШЛАМА ============
  {
    id: "flatbread",
    name: {
      ru: "Катырма · Гумма · Ишлама",
      uz: "Qatirma · Gumma · Ishlama",
      en: "Qatirma · Gumma · Ishlama",
    },
    items: [
      {
        id: "katyrma-meat",
        image: "/images/katyrma-meat.jpg",
        name: { ru: "Катырма с мясом", uz: "Go'shtli qatirma", en: "Qatirma with meat" },
        price: 25000,
      },
      {
        id: "katyrma-meat-cheese",
        image: "/images/katyrma-meat-cheese.jpg",
        name: {
          ru: "Катырма с мясом и сыром",
          uz: "Go'sht va pishloqli qatirma",
          en: "Qatirma with meat & cheese",
        },
        price: 29000,
      },
      {
        id: "katyrma-brynza-greens",
        image: "/images/katyrma-brynza-greens.jpg",
        name: {
          ru: "Катырма с брынзой и зеленью",
          uz: "Pishloq va ko'katli qatirma",
          en: "Qatirma with brynza & herbs",
        },
        price: 24000,
      },
      {
        id: "katyrma-cheese-greens",
        image: "/images/katyrma-cheese-greens.jpg",
        name: {
          ru: "Катырма с сыром и зеленью",
          uz: "Pishloq va ko'katli qatirma",
          en: "Qatirma with cheese & herbs",
        },
        price: 24000,
      },
      {
        id: "katyrma-pumpkin",
        image: "/images/katyrma-pumpkin.jpg",
        name: { ru: "Катырма с тыквой", uz: "Qovoqli qatirma", en: "Qatirma with pumpkin" },
        price: 22000,
      },
      {
        id: "gumma-meat",
        image: "/images/gumma-meat.jpg",
        name: { ru: "Гумма с мясом", uz: "Go'shtli gumma", en: "Gumma with meat" },
        price: 30000,
      },
      {
        id: "gumma-meat-cheese",
        image: "/images/gumma-meat-cheese.jpg",
        name: {
          ru: "Гумма с мясом и сыром",
          uz: "Go'sht va pishloqli gumma",
          en: "Gumma with meat & cheese",
        },
        price: 35000,
      },
      {
        id: "gumma-brynza-greens",
        image: "/images/gumma-brynza-greens.jpg",
        name: {
          ru: "Гумма с брынзой и зеленью",
          uz: "Pishloq va ko'katli gumma",
          en: "Gumma with brynza & herbs",
        },
        price: 19000,
      },
      {
        id: "gumma-cheese-greens",
        image: "/images/gumma-cheese-greens.jpg",
        name: {
          ru: "Гумма с сыром и зеленью",
          uz: "Pishloq va ko'katli gumma",
          en: "Gumma with cheese & herbs",
        },
        price: 30000,
      },
      {
        id: "gumma-pumpkin",
        image: "/images/gumma-pumpkin.jpg",
        name: { ru: "Гумма с тыквой", uz: "Qovoqli gumma", en: "Gumma with pumpkin" },
        price: 18000,
      },
      {
        id: "ishlama-meat-veg",
        image: "/images/ishlama-meat-veg.jpg",
        name: {
          ru: "Ишлама с мясом и овощами",
          uz: "Go'sht va sabzavotli ishlama",
          en: "Ishlama with meat & vegetables",
        },
        price: 38000,
      },
      {
        id: "ishlama-brynza-greens",
        image: "/images/ishlama-brynza-greens.jpg",
        name: {
          ru: "Ишлама с брынзой и зеленью",
          uz: "Pishloq va ko'katli ishlama",
          en: "Ishlama with brynza & herbs",
        },
        price: 40000,
      },
      {
        id: "ishlama-chicken-cheese",
        name: {
          ru: "Ишлама с курицей и сыром",
          uz: "Tovuq va pishloqli ishlama",
          en: "Ishlama with chicken & cheese",
        },
        price: 42000,
      },
    ],
  },

  // ============ БЛЮДА ИЗ ТЕСТА ============
  {
    id: "dough-dishes",
    name: {
      ru: "Блюда из теста",
      uz: "Xamir taomlari",
      en: "Dough dishes",
    },
    items: [
      {
        id: "tukum-barak",
        image: "/images/tukum-barak.jpg",
        name: { ru: "Тукум барак", uz: "Tuxum barak", en: "Tukum barak" },
        price: [
          { label: { ru: "4 шт", uz: "4 dona", en: "4 pcs" }, price: 30000 },
          { label: { ru: "8 шт", uz: "8 dona", en: "8 pcs" }, price: 55000 },
        ],
      },
      {
        id: "kulur-barak",
        image: "/images/kulur-barak.jpg",
        name: { ru: "Кулур барак", uz: "Kulur barak", en: "Kulur barak" },
        price: [
          { label: { ru: "4 шт", uz: "4 dona", en: "4 pcs" }, price: 30000 },
          { label: { ru: "8 шт", uz: "8 dona", en: "8 pcs" }, price: 55000 },
        ],
      },
      {
        id: "ushok-barak-dish",
        image: "/images/ushok-barak-dish.jpg",
        name: { ru: "Ушок барак", uz: "Ushoq barak", en: "Ushok barak" },
        price: [
          { label: { ru: "4 шт", uz: "4 dona", en: "4 pcs" }, price: 25000 },
          { label: { ru: "8 шт", uz: "8 dona", en: "8 pcs" }, price: 50000 },
        ],
      },
      {
        id: "kash-barak",
        image: "/images/kash-barak.jpg",
        name: { ru: "Каш барак", uz: "Qash barak", en: "Kash barak" },
        price: [
          { label: { ru: "4 шт", uz: "4 dona", en: "4 pcs" }, price: 25000 },
          { label: { ru: "8 шт", uz: "8 dona", en: "8 pcs" }, price: 50000 },
        ],
      },
      {
        id: "shavat-osh",
        image: "/images/shavat-osh.jpg",
        name: { ru: "Шават Ош", uz: "Shavat oshi", en: "Shavat osh" },
        price: 80000,
      },
      {
        id: "khansky-mix",
        image: "/images/khansky-mix.jpg",
        name: { ru: "Ханский микс", uz: "Xon miksi", en: "Khan's mix" },
        price: 395000,
      },
      {
        id: "khansky-manty",
        image: "/images/khansky-manty.jpg",
        name: { ru: "Ханские манты", uz: "Xon manti", en: "Khan's manty" },
        price: 60000,
      },
      {
        id: "manty-pumpkin",
        name: { ru: "Манты с тыквой", uz: "Qovoqli manti", en: "Pumpkin manty" },
        price: 55000,
      },
      {
        id: "manty-meat",
        name: { ru: "Манты с мясом", uz: "Go'shtli manti", en: "Meat manty" },
        price: 75000,
      },
    ],
  },

  // ============ ГОРЯЧИЕ БЛЮДА ============
  {
    id: "hot-mains",
    name: { ru: "Горячие блюда", uz: "Asosiy taomlar", en: "Hot mains" },
    items: [
      {
        id: "vaguri",
        image: "/images/vaguri.jpg",
        name: { ru: "Вагури", uz: "Vaguri", en: "Vaguri" },
        description: { ru: "1 кг", uz: "1 kg", en: "1 kg" },
        price: 370000,
        tags: [{ ru: "От шефа", uz: "Shefdan", en: "Chef's pick" }],
      },
      {
        id: "assorti-sazanchik",
        image: "/images/assorti-sazanchik.jpg",
        name: {
          ru: "Ассорти «Сазанчик»",
          uz: "«Sazanchik» assorti",
          en: "Sazanchik platter",
        },
        description: { ru: "2-3 персоны", uz: "2-3 kishi uchun", en: "for 2-3 persons" },
        price: 770000,
        tags: [{ ru: "Хит", uz: "Xit", en: "Hot" }],
      },
      {
        id: "tsyplyonok",
        image: "/images/tsyplyonok.jpg",
        name: { ru: "Цыплёнок", uz: "Jo'ja", en: "Spring chicken" },
        price: 120000,
      },
      {
        id: "chicken-breast-cream",
        image: "/images/chicken-breast-cream.jpg",
        name: {
          ru: "Куриная грудка в сливочно-грибном соусе",
          uz: "Qaymoq-qo'ziqorinli tovuq filesi",
          en: "Chicken breast in creamy mushroom sauce",
        },
        description: {
          ru: "Нежная куриная грудка, сливочный соус, шампиньоны",
          uz: "Yumshoq tovuq fileti, qaymoq sousi, qo'ziqorin",
          en: "Tender chicken breast, cream sauce, mushrooms",
        },
        price: 125000,
      },
      {
        id: "medallions",
        image: "/images/medallions.jpg",
        name: {
          ru: "Медальоны с овощами",
          uz: "Sabzavotli medalonlar",
          en: "Medallions with vegetables",
        },
        price: 190000,
      },
      {
        id: "potato-homestyle",
        image: "/images/potato-homestyle.jpg",
        name: {
          ru: "Картофель по-домашнему",
          uz: "Uy uslubidagi kartoshka",
          en: "Homestyle potato",
        },
        description: {
          ru: "Обжаренный кусочками картофель, тушёный с овощами",
          uz: "Qovurilgan kartoshka, sabzavotlar bilan dimlangan",
          en: "Pan-fried potato, stewed with vegetables",
        },
        price: 155000,
      },
      {
        id: "veal-tolyatina",
        image: "/images/veal-tolyatina.jpg",
        name: { ru: "Тельятина из телятины", uz: "Buzoq go'shti", en: "Veal tolyatina" },
        description: {
          ru: "Все стейки готовятся под заказ, пожалуйста, время приготовления",
          uz: "Stayklar buyurtma asosida tayyorlanadi",
          en: "Steaks prepared to order",
        },
        price: 190000,
      },
    ],
  },

  // ============ КАВКАЗСКИЕ ШАШЛЫКИ ============
  {
    id: "caucasian-grill",
    name: {
      ru: "Кавказские шашлыки",
      uz: "Kavkaz shashliklari",
      en: "Caucasian grill",
    },
    items: [
      {
        id: "beef-skewer",
        image: "/images/beef-skewer.jpg",
        name: {
          ru: "Кусковой шашлык из говядины",
          uz: "Mol go'shti shashligi",
          en: "Beef skewer",
        },
        price: 130000,
      },
      {
        id: "chicken-skewer",
        image: "/images/chicken-skewer.jpg",
        name: { ru: "Куриный шашлык", uz: "Tovuq shashligi", en: "Chicken skewer" },
        price: 60000,
      },
      {
        id: "chicken-wings-grill",
        image: "/images/chicken-wings-grill.jpg",
        name: { ru: "Куриные крылышки", uz: "Tovuq qanotlari", en: "Chicken wings" },
        price: 50000,
      },
      {
        id: "lamb-rib",
        image: "/images/lamb-rib.jpg",
        name: { ru: "Баранья корейка", uz: "Qo'y qovurg'asi", en: "Lamb rib" },
        price: 180000,
      },
      {
        id: "lyulya-kebab",
        image: "/images/lyulya-kebab.jpg",
        name: { ru: "Люля кебаб", uz: "Lyulya kabob", en: "Lyulya kebab" },
        price: 80000,
      },
      {
        id: "veg-grill",
        image: "/images/veg-grill.jpg",
        name: { ru: "Овощи на мангале", uz: "Mangaldagi sabzavotlar", en: "Grilled vegetables" },
        price: 170000,
      },
      {
        id: "setka-kabob",
        name: { ru: "Сетка кабоб", uz: "Setka kabob", en: "Setka kabob" },
        price: 125000,
      },
      {
        id: "beef-liver",
        name: { ru: "Говяжья печень", uz: "Mol jigari", en: "Beef liver" },
        price: 40000,
      },
    ],
  },

  // ============ РЫБА ============
  {
    id: "fish",
    name: { ru: "Рыба", uz: "Baliq", en: "Fish" },
    items: [
      {
        id: "sazan-neck",
        image: "/images/sazan-neck.jpg",
        name: { ru: "Шейка сазана", uz: "Sazan bo'yni", en: "Sazan neck" },
        description: { ru: "1 кг", uz: "1 kg", en: "1 kg" },
        price: 370000,
      },
      {
        id: "sazan-whole",
        image: "/images/sazan-whole.jpg",
        name: { ru: "Сазан целиком", uz: "Butun sazan", en: "Whole sazan" },
        description: {
          ru: "1 кг (без головы и без хвоста)",
          uz: "1 kg (boshsiz va dumsiz)",
          en: "1 kg (without head and tail)",
        },
        price: 210000,
        tags: [{ ru: "Хит", uz: "Xit", en: "Hot" }],
      },
      {
        id: "sudak",
        image: "/images/sudak.jpg",
        name: { ru: "Судак", uz: "Sudak", en: "Pike-perch" },
        price: 300000,
      },
      {
        id: "trout-whole",
        image: "/images/trout-whole.jpg",
        name: { ru: "Форель целиком", uz: "Butun forel", en: "Whole trout" },
        description: { ru: "1 кг", uz: "1 kg", en: "1 kg" },
        price: 290000,
      },
      {
        id: "salmon",
        image: "/images/salmon.jpg",
        name: { ru: "Лосось", uz: "Losos", en: "Salmon" },
        description: { ru: "1 кг", uz: "1 kg", en: "1 kg" },
        price: 295000,
      },
      {
        id: "sturgeon-whole",
        name: { ru: "Осётр целиком", uz: "Butun osyotr", en: "Whole sturgeon" },
        description: { ru: "1 кг", uz: "1 kg", en: "1 kg" },
        price: 470000,
      },
      {
        id: "som",
        name: { ru: "Сом", uz: "Laqqa", en: "Catfish" },
        description: { ru: "1 кг", uz: "1 kg", en: "1 kg" },
        price: 350000,
      },
    ],
  },

  // ============ ПАСТА ============
  {
    id: "pasta",
    name: { ru: "Паста", uz: "Pasta", en: "Pasta" },
    items: [
      {
        id: "alfredo-salmon",
        image: "/images/alfredo-salmon.jpg",
        name: {
          ru: "Альфредо с лососем",
          uz: "Lososli Alfredo",
          en: "Alfredo with salmon",
        },
        description: {
          ru: "Лосось, сливки, помидоры черри, соус альфредо, паста фетучини",
          uz: "Losos, qaymoq, pomidor, alfredo sousi, fettuchine",
          en: "Salmon, cream, cherry tomatoes, alfredo sauce, fettuccine",
        },
        price: 120000,
      },
      {
        id: "pasta-arrabbiata",
        image: "/images/pasta-arrabbiata.jpg",
        name: { ru: "Паста Арабьята", uz: "Arabbyata pasta", en: "Pasta Arrabbiata" },
        description: {
          ru: "Острый томатный соус с обжаренным чесноком, паста спагетти",
          uz: "Achchiq pomidor sousi, qaynatilgan sarimsoq, spagetti",
          en: "Spicy tomato sauce with roasted garlic, spaghetti",
        },
        price: 60000,
      },
      {
        id: "pasta-alfredo",
        image: "/images/pasta-alfredo.jpg",
        name: { ru: "Паста Альфредо", uz: "Alfredo pastasi", en: "Pasta Alfredo" },
        description: {
          ru: "Куриная грудка, грибы, паста сливки, пармезан",
          uz: "Tovuq, qo'ziqorin, qaymoq, parmezan",
          en: "Chicken breast, mushrooms, cream, parmesan",
        },
        price: 95000,
      },
      {
        id: "pasta-bolognese",
        name: { ru: "Паста Болоньезе", uz: "Bolonez pastasi", en: "Pasta Bolognese" },
        description: {
          ru: "Фарш говяжий, фарш свиной, томатный соус, паста спагетти",
          uz: "Mol farshi, pomidor sousi, spagetti",
          en: "Beef mince, tomato sauce, spaghetti",
        },
        price: 110000,
      },
    ],
  },

  // ============ СТЕЙКИ ============
  {
    id: "steaks",
    name: { ru: "Стейки", uz: "Steyklar", en: "Steaks" },
    items: [
      {
        id: "steak-classic",
        image: "/images/steak-classic.jpg",
        name: { ru: "Классический стейк", uz: "Klassik steyk", en: "Classic steak" },
        price: 215000,
      },
      {
        id: "steak-tbone",
        image: "/images/steak-tbone.jpg",
        name: { ru: "Стейк Тибон", uz: "T-bon steyki", en: "T-bone steak" },
        price: 255000,
      },
      {
        id: "steak-ribeye",
        name: { ru: "Стейк РибАй", uz: "Ribay steyki", en: "Ribeye steak" },
        price: 255000,
      },
      {
        id: "steak-minion",
        name: { ru: "Миньон стейк", uz: "Minyon steyki", en: "Filet mignon" },
        price: 235000,
      },
      {
        id: "steak-chicken",
        name: { ru: "Куриный стейк", uz: "Tovuq steyki", en: "Chicken steak" },
        price: 150000,
      },
      {
        id: "steak-pepper",
        name: { ru: "Пеппер стейк", uz: "Pepper steyk", en: "Pepper steak" },
        price: 220000,
      },
    ],
  },

  // ============ ГАРНИРЫ ============
  {
    id: "sides",
    name: { ru: "Гарниры", uz: "Garnirlar", en: "Sides" },
    items: [
      {
        id: "potato-rustic",
        name: {
          ru: "Картофель по-деревенски",
          uz: "Qishloq uslubidagi kartoshka",
          en: "Rustic potatoes",
        },
        price: 50000,
      },
      {
        id: "grilled-veg",
        name: { ru: "Овощи на гриле", uz: "Grildagi sabzavotlar", en: "Grilled vegetables" },
        price: 65000,
      },
      {
        id: "boiled-pasta",
        name: { ru: "Отварная паста", uz: "Qaynatilgan pasta", en: "Boiled pasta" },
        price: 40000,
      },
      {
        id: "mashed-potato",
        name: { ru: "Картофельное пюре", uz: "Kartoshka pyuresi", en: "Mashed potato" },
        price: 40000,
      },
      {
        id: "rice-veg",
        name: { ru: "Рис с овощами", uz: "Sabzavotli guruch", en: "Rice with vegetables" },
        price: 50000,
      },
      {
        id: "grilled-corn",
        name: { ru: "Кукуруза на гриле", uz: "Grildagi makka", en: "Grilled corn" },
        price: 40000,
      },
      {
        id: "fries",
        name: { ru: "Картофель фри", uz: "Fri kartoshka", en: "French fries" },
        price: 40000,
      },
    ],
  },

  // ============ ХЛЕБ ============
  {
    id: "bread",
    name: { ru: "Хлеб", uz: "Non", en: "Bread" },
    items: [
      {
        id: "katlama-patyr",
        name: { ru: "Катлама патыр", uz: "Qatlama patir", en: "Katlama patyr" },
        price: 25000,
      },
      {
        id: "grey-bread",
        name: { ru: "Серый хлеб", uz: "Kulrang non", en: "Grey bread" },
        price: 10000,
      },
      {
        id: "black-bread",
        name: { ru: "Чёрный хлеб", uz: "Qora non", en: "Black bread" },
        price: 10000,
      },
      {
        id: "kizil-non",
        name: { ru: "Кизил нон", uz: "Qizil non", en: "Kizil non" },
        price: 17000,
      },
      {
        id: "khorezm-non",
        name: { ru: "Хорезм нон", uz: "Xorazm non", en: "Khorezm non" },
        price: 20000,
      },
      {
        id: "pushli-patyr",
        name: { ru: "Пушли патыр", uz: "Pushli patir", en: "Pushli patyr" },
        price: 35000,
      },
    ],
  },

  // ============ ВАФЛИ ============
  {
    id: "waffles",
    name: { ru: "Вафли", uz: "Vaflilar", en: "Waffles" },
    items: [
      {
        id: "waffle-fruit-mix",
        name: { ru: "Фруктовый микс", uz: "Mevali mix", en: "Fruit mix" },
        price: 85000,
      },
      {
        id: "waffle-strawberry-banana-nutella",
        name: {
          ru: "Клубнично-банан нутелла",
          uz: "Qulupnay-banan nutella",
          en: "Strawberry-banana Nutella",
        },
        price: 80000,
      },
      {
        id: "waffle-strawberry-nutella",
        name: { ru: "Клубника нутелла", uz: "Qulupnay nutella", en: "Strawberry Nutella" },
        price: 75000,
      },
      {
        id: "waffle-lotus",
        name: { ru: "Лотус", uz: "Lotus", en: "Lotus" },
        price: 60000,
      },
      {
        id: "waffle-oreo",
        name: { ru: "Орео", uz: "Oreo", en: "Oreo" },
        price: 60000,
      },
      {
        id: "waffle-banana-nutella",
        name: { ru: "Банан нутелла", uz: "Banan nutella", en: "Banana Nutella" },
        price: 65000,
      },
      {
        id: "waffle-nut-nutella",
        name: { ru: "Орех и нутелла", uz: "Yong'oq va nutella", en: "Nut & Nutella" },
        price: 70000,
      },
      {
        id: "waffle-berry-jam",
        name: { ru: "Ягодный джем", uz: "Meva murabbosi", en: "Berry jam" },
        price: 60000,
      },
      {
        id: "waffle-chocolate",
        name: { ru: "Шоколадная", uz: "Shokoladli", en: "Chocolate" },
        price: 50000,
      },
      {
        id: "waffle-classic",
        name: { ru: "Классическая", uz: "Klassik", en: "Classic" },
        price: 40000,
      },
    ],
  },

  // ============ ДЕСЕРТЫ / ФОНДЮ ============
  {
    id: "desserts",
    name: { ru: "Десерты", uz: "Shirinliklar", en: "Desserts" },
    items: [
      {
        id: "fondue-mix",
        name: { ru: "Фондю микс", uz: "Fondyu mix", en: "Fondue mix" },
        price: 375000,
      },
      {
        id: "fruit-mood",
        name: {
          ru: "Фруктовое настроение",
          uz: "Mevali kayfiyat",
          en: "Fruit mood",
        },
        price: 250000,
      },
      {
        id: "fondue-strawberry",
        name: { ru: "Фондю клубника", uz: "Qulupnayli fondyu", en: "Strawberry fondue" },
        price: 325000,
      },
    ],
  },

  // ============ КОФЕ ============
  {
    id: "coffee",
    name: { ru: "Кофе", uz: "Kofe", en: "Coffee" },
    items: [
      { id: "americano", name: { ru: "Американо", uz: "Amerikano", en: "Americano" }, price: 30000 },
      { id: "espresso", name: { ru: "Эспрессо", uz: "Espresso", en: "Espresso" }, price: 30000 },
      { id: "cappuccino", name: { ru: "Капучино", uz: "Kapuchino", en: "Cappuccino" }, price: 32000 },
      { id: "latte", name: { ru: "Латте", uz: "Latte", en: "Latte" }, price: 32000 },
      { id: "raf", name: { ru: "Раф", uz: "Raf", en: "Raf" }, price: 35000 },
      { id: "flat-white", name: { ru: "Флэт уайт", uz: "Flat uayt", en: "Flat white" }, price: 35000 },
    ],
  },

  // ============ ЧАЙ ============
  {
    id: "tea",
    name: { ru: "Чай", uz: "Choy", en: "Tea" },
    items: [
      { id: "tea-assam", name: { ru: "Ассам", uz: "Assam", en: "Assam" }, price: 25000 },
      { id: "tea-earl-grey", name: { ru: "Эрл грей", uz: "Earl Grey", en: "Earl Grey" }, price: 25000 },
      { id: "tea-jasmine", name: { ru: "Жасмин", uz: "Yasmin", en: "Jasmine" }, price: 27000 },
      { id: "tea-milk-oolong", name: { ru: "Молочный улун", uz: "Sutli ulun", en: "Milk oolong" }, price: 35000 },
      {
        id: "tea-moroccan",
        name: { ru: "Марокканский чай", uz: "Marokash choyi", en: "Moroccan tea" },
        price: 40000,
      },
      {
        id: "tea-ginger",
        name: { ru: "Имбирный чай", uz: "Zanjabilli choy", en: "Ginger tea" },
        price: 40000,
      },
      { id: "tea-berry", name: { ru: "Ягодный чай", uz: "Mevali choy", en: "Berry tea" }, price: 60000 },
      {
        id: "tea-thyme",
        name: { ru: "С чабрецом", uz: "Kiyik o'tli", en: "Thyme tea" },
        price: 40000,
      },
      {
        id: "tea-vitamin",
        name: { ru: "Витаминный", uz: "Vitaminli", en: "Vitamin tea" },
        price: 55000,
      },
    ],
  },

  // ============ ФРЕШИ / СМУЗИ / ЛИМОНАДЫ ============
  {
    id: "fresh-drinks",
    name: {
      ru: "Фреши · Смузи · Лимонады",
      uz: "Fresh · Smuti · Limonadlar",
      en: "Fresh · Smoothies · Lemonades",
    },
    items: [
      { id: "fresh-orange", name: { ru: "Апельсиновый фреш", uz: "Apelsin fresh", en: "Orange fresh" }, price: 55000 },
      { id: "fresh-apple", name: { ru: "Яблочный фреш", uz: "Olma fresh", en: "Apple fresh" }, price: 50000 },
      { id: "fresh-carrot", name: { ru: "Морковный фреш", uz: "Sabzi fresh", en: "Carrot fresh" }, price: 40000 },
      { id: "fresh-vitamin", name: { ru: "Витаминный фреш", uz: "Vitamin fresh", en: "Vitamin fresh" }, price: 45000 },
      { id: "smoothie-avocado", name: { ru: "Смузи авокадо", uz: "Avokado smuti", en: "Avocado smoothie" }, price: 45000 },
      { id: "smoothie-apple-kiwi", name: { ru: "Яблоко-киви", uz: "Olma-kivi", en: "Apple-kiwi smoothie" }, price: 45000 },
      { id: "smoothie-beet", name: { ru: "Свекольный", uz: "Lavlagi smuti", en: "Beet smoothie" }, price: 45000 },
      { id: "smoothie-kiwi-celery", name: { ru: "Киви-сельдерей", uz: "Kivi-seldereyli", en: "Kiwi-celery smoothie" }, price: 45000 },
      { id: "milkshake-oreo", name: { ru: "Милкшейк Орео", uz: "Oreo milkshake", en: "Oreo milkshake" }, price: 50000 },
      { id: "milkshake-banana", name: { ru: "Банановый милкшейк", uz: "Banan milkshake", en: "Banana milkshake" }, price: 45000 },
      { id: "milkshake-vanilla", name: { ru: "Ванильный милкшейк", uz: "Vanilli milkshake", en: "Vanilla milkshake" }, price: 40000 },
      { id: "milkshake-choc", name: { ru: "Шоколадный милкшейк", uz: "Shokolad milkshake", en: "Chocolate milkshake" }, price: 42000 },
      { id: "lemonade-tarhun", name: { ru: "Тархун", uz: "Tarxun", en: "Tarragon lemonade" }, price: 65000 },
      { id: "lemonade-mango", name: { ru: "Манго-маракуйя", uz: "Mango-marakuya", en: "Mango-passionfruit lemonade" }, price: 85000 },
      { id: "lemonade-citrus", name: { ru: "Цитрусовый", uz: "Sitrusli", en: "Citrus lemonade" }, price: 75000 },
      { id: "lemonade-berry", name: { ru: "Ягодный", uz: "Mevali", en: "Berry lemonade" }, price: 60000 },
      { id: "mojito-classic", name: { ru: "Мохито классический", uz: "Klassik mohito", en: "Classic mojito" }, price: 67000 },
      { id: "mojito-strawberry", name: { ru: "Мохито клубничный", uz: "Qulupnayli mohito", en: "Strawberry mojito" }, price: 72000 },
    ],
  },

  // ============ ХОЛОДНЫЕ НАПИТКИ ============
  {
    id: "cold-drinks",
    name: { ru: "Холодные напитки", uz: "Sovuq ichimliklar", en: "Cold drinks" },
    items: [
      { id: "drink-chortok-05", name: { ru: "Чорток 0.5 л", uz: "Chortoq 0.5 l", en: "Chortok 0.5 L" }, price: 25000 },
      { id: "drink-borjomi-05", name: { ru: "Боржоми 0.5 л", uz: "Borjomi 0.5 l", en: "Borjomi 0.5 L" }, price: 32000 },
      { id: "drink-redbull", name: { ru: "Ред Булл 0.25 л", uz: "Red Bull 0.25 l", en: "Red Bull 0.25 L" }, price: 30000 },
      { id: "drink-cola", name: { ru: "Кола 0.25 л", uz: "Kola 0.25 l", en: "Cola 0.25 L" }, price: 25000 },
      { id: "drink-pepsi", name: { ru: "Пепси 0.25 л", uz: "Pepsi 0.25 l", en: "Pepsi 0.25 L" }, price: 25000 },
      { id: "drink-tassay", name: { ru: "Тассай газ/без 0.5 л", uz: "Tassay gazli/gazsiz 0.5 l", en: "Tassay sparkling/still 0.5 L" }, price: 22000 },
      { id: "drink-tassay-1l", name: { ru: "Тассай газ/без 1 л", uz: "Tassay gazli/gazsiz 1 l", en: "Tassay sparkling/still 1 L" }, price: 30000 },
      { id: "drink-tassay-emerald", name: { ru: "Tassay Emerald 0.75 л", uz: "Tassay Emerald 0.75 l", en: "Tassay Emerald 0.75 L" }, price: 50000 },
      { id: "drink-tassay-excellent", name: { ru: "Tassay Excellent 0.75 л", uz: "Tassay Excellent 0.75 l", en: "Tassay Excellent 0.75 L" }, price: 50000 },
    ],
  },
];
