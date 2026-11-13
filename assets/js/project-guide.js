/* Project selection assistant: converts user intent into a service and a prefilled brief. */
(function () {
  "use strict";
  var button = document.getElementById("guide-submit");
  var goal = document.getElementById("guide-goal");
  var materials = document.getElementById("guide-materials");
  var priority = document.getElementById("guide-priority");
  var result = document.getElementById("guide-result");
  var title = document.getElementById("guide-result-title");
  var copy = document.getElementById("guide-result-copy");
  var context = document.getElementById("guide-result-context");
  var link = document.getElementById("guide-result-link");
  if (!button || !goal || !materials || !priority || !result || !title || !copy || !context || !link) return;

  var recommendations = {
    leads: {
      service: "landing", title: "Лендинг для получения заявок",
      copy: "Подойдёт, если нужно ясно представить одно предложение и привести посетителя к заявке. Текущая стартовая цена лендинга — от 5 000 ₽; дополнительные функции и объём согласуются отдельно."
    },
    company: {
      service: "card", title: "Сайт-визитка для компании или специалиста",
      copy: "Хороший вариант, если нужно представить несколько услуг, рассказать о компании и собрать контакты. Текущая стартовая цена сайта-визитки — от 12 000 ₽."
    },
    catalog: {
      service: "custom", title: "Индивидуальный сайт или каталог",
      copy: "Лучше сначала согласовать состав функций: каталог, бронирование, магазин или интеграции могут сильно отличаться по объёму. Точную стоимость назовём после брифа."
    },
    video: {
      service: "video", title: "Видеомонтаж под вашу площадку",
      copy: "В брифе укажем тип ролика, площадку и исходные материалы. Цена и срок зависят от длительности, сложности монтажа и количества правок."
    },
    graphics: {
      service: "design", title: "Графический дизайн",
      copy: "Подойдёт для карточек товаров, баннеров и визуалов для социальных сетей. В брифе уточним форматы, количество макетов и наличие материалов."
    },
    unsure: {
      service: "custom", title: "Сначала коротко обсудим задачу",
      copy: "Если пока нет уверенности в формате, выберите индивидуальную задачу. В брифе можно описать цель своими словами — подскажем следующий шаг."
    }
  };
  var materialsLabels = {
    none: "материалы: пока не подготовлены, нужна помощь с нуля",
    some: "материалы: подготовлена часть",
    ready: "материалы: основные тексты и материалы готовы"
  };
  var priorityLabels = {
    speed: "приоритет: быстрый запуск без лишних задержек",
    clarity: "приоритет: понятная структура и удобство",
    visual: "приоритет: сильная визуальная подача",
    growth: "приоритет: возможность расширения проекта"
  };
  button.addEventListener("click", function () {
    var item = recommendations[goal.value] || recommendations.unsure;
    var note = "Цель проекта: " + goal.options[goal.selectedIndex].text + "; " +
      (materialsLabels[materials.value] || "") + "; " +
      (priorityLabels[priority.value] || "") + ".";
    title.textContent = item.title;
    copy.textContent = item.copy;
    context.textContent = "В бриф будет добавлено: " + note;
    link.href = "order.html?service=" + encodeURIComponent(item.service) + "&briefNote=" + encodeURIComponent(note);
    result.hidden = false;
    result.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  });
})();
