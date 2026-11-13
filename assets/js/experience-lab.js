/* SWS LAB: lightweight, accessible interactive portfolio preview. No tracking or external dependencies. */
(function () {
  "use strict";
  var root = document.querySelector("[data-sws-lab]");
  if (!root) return;
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"][data-lab-target]'));
  var panels = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
  var cta = root.querySelector("#sws-lab-cta");
  var caption = root.querySelector("#sws-lab-caption");
  var options = {
    web: { href: "order.html?service=landing", label: "Обсудить сайт ↗",
      caption: "Концепт интерфейса • интерактивная визуализация" },
    video: { href: "order.html?service=video", label: "Заказать монтаж ↗",
      caption: "Демо анимации и монтажного таймлайна • не реальный видеоролик" },
    design: { href: "order.html?service=design", label: "Заказать дизайн ↗",
      caption: "Демо карточки товара • нажимайте на цветовые варианты" }
  };
  function select(tab, focus) {
    var target = tab.getAttribute("data-lab-target");
    if (!Object.prototype.hasOwnProperty.call(options, target)) return;
    tabs.forEach(function (item) {
      var active = item === tab;
      item.setAttribute("aria-selected", active ? "true" : "false");
      item.setAttribute("tabindex", active ? "0" : "-1");
      item.classList.toggle("is-active", active);
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.id !== "sws-lab-panel-" + target;
    });
    if (cta) {
      cta.href = options[target].href;
      cta.textContent = options[target].label;
    }
    if (caption) caption.textContent = options[target].caption;
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab, false); });
    tab.addEventListener("keydown", function (event) {
      var keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
      if (keys.indexOf(event.key) === -1) return;
      event.preventDefault();
      var index = i;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") index = (i + 1) % tabs.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") index = (i - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") index = 0;
      if (event.key === "End") index = tabs.length - 1;
      select(tabs[index], true);
    });
  });
  if (tabs.length) select(tabs[0], false);
  var play = root.querySelector("#sws-lab-play");
  var video = root.querySelector("#sws-lab-video");
  if (play && video) {
    play.addEventListener("click", function () {
      var playing = video.classList.toggle("is-playing");
      play.setAttribute("aria-pressed", playing ? "true" : "false");
      play.setAttribute("aria-label", playing ? "Остановить демо-анимацию" : "Запустить демо-анимацию");
      play.textContent = playing ? "Ⅱ Пауза" : "▶ Смотреть демо";
    });
  }
  var product = root.querySelector("#sws-lab-product");
  var swatches = Array.prototype.slice.call(root.querySelectorAll("[data-lab-color]"));
  var colors = {cyan:"#69eff2",coral:"#ff9777",violet:"#c3a7ff"};
  swatches.forEach(function (button) {
    button.addEventListener("click", function () {
      var name = button.getAttribute("data-lab-color");
      if (!product || !Object.prototype.hasOwnProperty.call(colors, name)) return;
      product.style.setProperty("--lab-product-accent", colors[name]);
      swatches.forEach(function (item) { item.setAttribute("aria-pressed", item === button ? "true" : "false"); });
    });
  });
})();