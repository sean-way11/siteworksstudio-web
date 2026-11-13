/* SiteWorksStudio 3.0 — BUILD MODE. Self-contained interactive first screen. */
(function () {
  "use strict";
  var host = document.querySelector("[data-build-mode]");
  if (!host) return;
  var serviceButtons = Array.prototype.slice.call(host.querySelectorAll("[data-build-service]"));
  var stepButtons = Array.prototype.slice.call(host.querySelectorAll("[data-build-step]"));
  var board = host.querySelector(".sws-build-board");
  var title = host.querySelector("#sws-build-title");
  var description = host.querySelector("#sws-build-description");
  var overline = host.querySelector("#sws-build-overline");
  var progress = host.querySelector("#sws-build-progress");
  var artifacts = host.querySelector("#sws-build-artifacts");
  var next = host.querySelector("#sws-build-next");
  var orderLink = host.querySelector("#sws-build-order");
  if (!board || !title || !description || !overline || !progress || !artifacts || !next || !orderLink) return;
  var content = {
    web: {
      name: "Сайт", order: "landing",
      stages: [
        {tag:"IDEA / 01", title:"Задача — получать заявки.",
          text:"Сначала определяем цель, аудиторию и путь посетителя. Не начинаем с анимаций.",
          items:["Цель бизнеса","Структура страниц","Ключевое действие"]},
        {tag:"BUILD / 02", title:"Собираем работающий интерфейс.",
          text:"Дизайн, адаптивная вёрстка и формы превращаются в единую систему.",
          items:["Дизайн-система","Мобильная версия","Рабочая форма"]},
        {tag:"RESULT / 03", title:"Сайт готов к использованию.",
          text:"Проверяем страницы, публикуем и показываем, как ими управлять.",
          items:["Опубликованный сайт","Проверка на телефоне","Передача результата"]}
      ]
    },
    video: {
      name: "Видео", order: "video",
      stages: [
        {tag:"IDEA / 01",title:"Есть история, которую нужно рассказать.",
          text:"Уточняем формат, платформу, материалы и основной смысл ролика.",
          items:["Формат","Сценарный замысел","Исходные кадры"]},
        {tag:"BUILD / 02",title:"Находим ритм каждого кадра.",
          text:"Собираем монтаж, титры, акценты и согласуем визуальный темп.",
          items:["Отбор кадров","Монтаж и ритм","Графика и титры"]},
        {tag:"RESULT / 03",title:"Готовый ролик под площадку.",
          text:"Экспортируем согласованную версию в нужном формате.",
          items:["Финальная версия","Формат площадки","Передача файлов"]}
      ]
    },
    design: {
      name: "Дизайн", order: "design",
      stages: [
        {tag:"IDEA / 01",title:"Нужен визуал, который замечают.",
          text:"Изучаем продукт, аудиторию, материалы и требования площадки.",
          items:["Задача визуала","Референсы","Требования формата"]},
        {tag:"BUILD / 02",title:"Собираем узнаваемый образ.",
          text:"Композиция, типографика и цвета работают на сообщение, а не наоборот.",
          items:["Композиция","Цвет и шрифт","Проверка читаемости"]},
        {tag:"RESULT / 03",title:"Материалы готовы к публикации.",
          text:"Подготавливаем согласованные изображения в нужных размерах.",
          items:["Готовые макеты","Файлы нужного размера","Передача результата"]}
      ]
    }
  };
  var service = "web", stage = 0;
  function render(focus) {
    var item = content[service].stages[stage];
    board.setAttribute("data-build-active",service);
    board.setAttribute("data-build-phase",String(stage+1));
    serviceButtons.forEach(function(button) {
      var selected = button.getAttribute("data-build-service")===service;
      button.setAttribute("aria-pressed", selected?"true":"false");
    });
    stepButtons.forEach(function(button) {
      var selected = Number(button.getAttribute("data-build-step"))===stage;
      button.setAttribute("aria-pressed", selected?"true":"false");
      button.classList.toggle("is-current",selected);
    });
    overline.textContent = content[service].name.toUpperCase() + " / " + item.tag;
    title.textContent = item.title;
    description.textContent = item.text;
    progress.style.setProperty("--build-progress",String((stage+1)*100/3)+"%");
    artifacts.textContent = "";
    item.items.forEach(function(label) {
      var li = document.createElement("li");
      li.textContent = label;
      artifacts.appendChild(li);
    });
    orderLink.href = "order.html?service="+encodeURIComponent(content[service].order);
    orderLink.textContent = "Обсудить "+(service==="web"?"сайт":service==="video"?"ролик":"дизайн")+" ↗";
    next.textContent = stage===2?"Начать с идеи ↺":"Следующий этап →";
    if (focus) title.focus({preventScroll:true});
  }
  serviceButtons.forEach(function(button) {
    button.addEventListener("click",function() {
      service=button.getAttribute("data-build-service");
      stage=0;
      if(content[service])render(false);
    });
  });
  stepButtons.forEach(function(button) {
    button.addEventListener("click",function() {
      var index=Number(button.getAttribute("data-build-step"));
      if(index>=0&&index<3){stage=index;render(false);}
    });
  });
  next.addEventListener("click",function(){stage=(stage+1)%3;render(false);});
  render(false);
})();