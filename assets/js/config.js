/* =====================================================================
   CONFIG: единственное место настроек сайта. Обычный скрипт (не JSON),
   чтобы сайт открывался двойным щелчком без сервера.
   ===================================================================== */
var CONFIG = {
  studio: {
    name: "SiteWorksStudio",
    tagline: "Сайты, видеомонтаж и графический дизайн."
  },

  // Заполняется при публикации на хостинге (см. README). Сейчас пусто: сайт локальный.
  site: { baseUrl: "" },

  telegram: {
    username: "SiteWorksStudio_bot",
    // Если ссылка с текстом длиннее этого числа символов, текст копируется
    // в буфер, а Telegram открывается без текста (его вставляют вручную).
    maxUrlLength: 2000
  },

  // Предоплата полностью выключена. Ссылка очищена до проверки платёжной страницы.
  // provider: место для будущего подключения официального сервиса (например, с СБП).
  prepay: {
    enabled: false,
    requireConfirm: true,
    url: "",
    provider: null
  },

  brief: { header: "БРИФ v2" },   // первая строка сообщения: по ней будущий бот узнает бриф

  pricingNote: "Стоимость и сроки обсуждаются индивидуально",

  cta: { label: "Обсудить проект", href: "order.html" },

  // Единое меню на всех страницах (рисуется в site.js).
  nav: [
    { id: "home", label: "Главная", href: "index.html" },
    { id: "services", label: "Услуги и цены", href: "services.html", children: [
      { label: "Создание сайтов", href: "services.html#sites" },
      { label: "Видеомонтаж", href: "services.html#video" },
      { label: "Графический дизайн", href: "services.html#design" }
    ] },
    { id: "portfolio", label: "Портфолио", href: "portfolio.html" },
    { id: "order", label: "Заказать услугу", href: "order.html" },
    { id: "about", label: "О студии и FAQ", href: "about.html" }
  ],

  // Тарифы на сайты. Цены и сроки согласованы: «от», срок ориентировочный.
  tariffs: {
    landing: {
      name: "Лендинг",
      orderKind: "лендинг",            // как слово звучит во фразе «Хочу заказать …»
      price: "от 5 000 ₽",
      priced: true,
      deadline: "2 дня",
      description: "Одна страница: что вы предлагаете, цены, форма заявки."
    },
    card: {
      name: "Сайт-визитка",
      orderKind: "сайт-визитку",
      price: "от 12 000 ₽",
      priced: true,
      deadline: "5 дней",
      description: "До пяти страниц, карта, контакты, отзывы."
    },
    custom: {
      name: "Под вашу задачу",
      orderKind: "другую задачу",
      price: "по договорённости",
      priced: false,
      buttonText: "Другая задача",
      description: "Запись онлайн, калькулятор, небольшой магазин. Обсудим и назовём точную цену."
    }
  },

  // Направления. У видеомонтажа и дизайна цен и сроков нет: позже можно добавить поле pricing.
  services: {
    sites:  { title: "Создание сайтов" },
    video:  { title: "Видеомонтаж", orderKind: "видеомонтаж" },
    design: { title: "Графический дизайн", orderKind: "графический дизайн" }
  },

  // Что можно выбрать в заказе (порядок = порядок в списке).
  orderOptions: ["landing", "card", "custom", "video", "design"]
};

// Готовим производные тексты (один раз, чистые вычисления).
function prepareConfig() {
  Object.keys(CONFIG.tariffs).forEach(function (id) {
    var t = CONFIG.tariffs[id];
    t.text = t.description + (t.deadline ? " Ориентировочный срок — " + t.deadline + "." : "");
    t.buttonText = t.priced ? "Заказать " + t.orderKind + " — " + t.price : t.buttonText;
    t.kindForMessage = t.orderKind + (t.priced ? " (" + t.price + ")" : "");
    t.title = t.priced ? t.name + " (" + t.price + ")" : t.name;
  });
}
prepareConfig();

// Список вариантов заказа: [{id, group, title, kind, buttonText}].
function getOrderOptions() {
  return CONFIG.orderOptions.map(function (id) {
    var t = CONFIG.tariffs[id];
    if (t) return { id: id, group: "sites", title: t.title, kind: t.kindForMessage, buttonText: t.buttonText };
    var s = CONFIG.services[id];
    return { id: id, group: id, title: s.title, kind: s.orderKind, buttonText: "Заказать " + s.orderKind };
  });
}
