/* SiteWorksStudio: project scope + baseline price estimator (no unapproved prices). */
(function () {
  "use strict";
  var root = document.getElementById("project-estimator");
  if (!root || typeof CONFIG === "undefined" || !CONFIG.tariffs) return;
  var pages = document.getElementById("estimate-pages");
  var pageCount = document.getElementById("estimate-page-count");
  var material = document.getElementById("estimate-materials");
  var priority = document.getElementById("estimate-priority");
  var extras = Array.prototype.slice.call(root.querySelectorAll('input[name="estimate-extra"]'));
  var price = document.getElementById("estimate-price");
  var kind = document.getElementById("estimate-kind");
  var commentary = document.getElementById("estimate-explanation");
  var details = document.getElementById("estimate-details");
  var link = document.getElementById("estimate-link");
  var copy = document.getElementById("estimate-copy");
  var share = document.getElementById("estimate-share");
  var exportButton = document.getElementById("estimate-export");
  var status = document.getElementById("estimate-copy-status");
  if (!pages || !pageCount || !material || !priority || !price || !kind || !commentary || !details || !link || !copy) return;

  var extrasLabels = {
    booking: "Онлайн-запись",
    shop: "Каталог или оплата",
    integration: "Интеграции",
    content: "Помощь с текстами",
    unique: "Индивидуальный дизайн"
  };
  var materialsLabels = {
    ready: "Материалы готовы",
    partial: "Часть материалов готова",
    none: "Нужна помощь с материалами"
  };
  var priorityLabels = {
    standard: "Обычный срок",
    soon: "Приоритетная задача",
    flexible: "Срок гибкий"
  };
  var lastText = "";
  // Public parameters only: these contain no personal/contact information.
  var params = new URLSearchParams(window.location.search);
  var requestedCount = Number(params.get("epages"));
  if (Number.isInteger(requestedCount) && requestedCount >= 1 && requestedCount <= 12) pages.value = String(requestedCount);
  if (["ready","partial","none"].indexOf(params.get("ematerials")) !== -1) material.value = params.get("ematerials");
  if (["standard","soon","flexible"].indexOf(params.get("epriority")) !== -1) priority.value = params.get("epriority");
  var requestedExtras = (params.get("eextras") || "").split(",");
  extras.forEach(function (input) { input.checked = requestedExtras.indexOf(input.value) !== -1; });
  function shareLink() {
    var url = new URL(window.location.href);
    url.searchParams.set("epages", String(pages.value));
    url.searchParams.set("ematerials", material.value);
    url.searchParams.set("epriority", priority.value);
    var checked = extras.filter(function (input) { return input.checked; }).map(function (input) { return input.value; });
    if (checked.length) url.searchParams.set("eextras", checked.join(","));
    else url.searchParams.delete("eextras");
    url.hash = "project-estimator";
    return url.href;
  }
  function createItem(text) {
    var item = document.createElement("li");
    item.textContent = text;
    return item;
  }
  function update() {
    var count = Math.min(12, Math.max(1, parseInt(pages.value, 10) || 1));
    pageCount.textContent = String(count);
    var selected = extras.filter(function (input) { return input.checked; })
      .map(function (input) { return extrasLabels[input.value] || ""; }).filter(Boolean);
    var complex = count > 5 || selected.some(function (name) {
      return name === extrasLabels.booking || name === extrasLabels.shop || name === extrasLabels.integration;
    });
    var service = complex ? "custom" : count === 1 ? "landing" : "card";
    var tariff = CONFIG.tariffs[service];
    var title = service === "custom" ? "Индивидуальный проект" : tariff.name;
    var baseline = tariff.priced ? tariff.price : "По договорённости";
    kind.textContent = title;
    price.textContent = baseline;
    commentary.textContent = tariff.priced
      ? "Это стартовая цена выбранного формата, а не окончательный расчёт. Дополнительные работы оцениваются отдельно."
      : "Нужно оценить состав функций, объём и сроки. Стоимость согласуем после получения брифа.";
    while (details.firstChild) details.removeChild(details.firstChild);
    details.appendChild(createItem("Страниц: " + count));
    details.appendChild(createItem("Дополнительно: " + (selected.length ? selected.join(", ") : "без дополнительных функций")));
    details.appendChild(createItem(materialsLabels[material.value] || materialsLabels.partial));
    details.appendChild(createItem(priorityLabels[priority.value] || priorityLabels.standard));
    lastText = "Предварительная оценка SiteWorksStudio: " + title + ", " + count + " стр. " +
      "Функции: " + (selected.length ? selected.join(", ") : "стандартные") + ". " +
      (materialsLabels[material.value] || materialsLabels.partial) + ". " +
      (priorityLabels[priority.value] || priorityLabels.standard) + ". " +
      "Цена: " + baseline + " (не окончательная).";
    link.href = "order.html?service=" + encodeURIComponent(service) + "&scope=" + encodeURIComponent(lastText.slice(0,550));
    if (status) status.textContent = "";
  }
  function legacyCopy(value) {
    var textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    textarea.remove();
    return ok;
  }
  [pages, material, priority].forEach(function (input) {
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });
  extras.forEach(function (input) { input.addEventListener("change", update); });
  copy.addEventListener("click", function () {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(lastText).then(function () {
        if (status) status.textContent = "Параметры скопированы.";
      }).catch(function () {
        if (status) status.textContent = legacyCopy(lastText) ? "Параметры скопированы." : "Не удалось скопировать. Используйте кнопку перехода к заявке.";
      });
    } else {
      if (status) status.textContent = legacyCopy(lastText) ? "Параметры скопированы." : "Не удалось скопировать. Используйте кнопку перехода к заявке.";
    }
  });
  if (share) share.addEventListener("click", function () {
    var address = shareLink();
    if (navigator.share) {
      navigator.share({title:"Расчёт проекта SiteWorksStudio",text:lastText,url:address}).then(function () {
        if(status) status.textContent="Расчёт готов к отправке.";
      }).catch(function (err) {
        if(err && err.name==="AbortError")return;
        if(status)status.textContent="Не удалось открыть меню отправки. Скопируйте параметры вручную.";
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(address).then(function () {
        if(status)status.textContent="Ссылка на ваш расчёт скопирована ✓";
      }).catch(function () {
        if(status)status.textContent=legacyCopy(address)?"Ссылка на ваш расчёт скопирована ✓":"Не удалось скопировать ссылку.";
      });
    } else {
      if(status)status.textContent=legacyCopy(address)?"Ссылка на ваш расчёт скопирована ✓":"Не удалось скопировать ссылку.";
    }
  });
  if (exportButton) exportButton.addEventListener("click", function () {
    var blob = new Blob([lastText + "\n\nСсылка на расчёт: " + shareLink()], {type:"text/plain;charset=utf-8"});
    var objectUrl = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "SiteWorksStudio-raschet.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1000);
    if(status)status.textContent="Расчёт сохранён в файл ✓";
  });
  update();
})();
