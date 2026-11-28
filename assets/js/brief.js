/* brief.js: страница заказа. Нужен config.js перед ним.
   Бриф формируется в браузере; заявки сохраняются в SiteWorksStudio OS через Supabase Edge Function. */

/* =====================================================================
   СХЕМА БРИФА. always = поле видно всегда; services = для каких услуг;
   без services (и без always) = для любой выбранной услуги.
   ===================================================================== */
var DEADLINES = ["Как можно скорее", "В течение недели", "В течение месяца", "Не срочно"];
var BRIEF_SCHEMA = [
  { id: "name", label: "Как к вам обращаться", summaryLabel: "Имя",
    type: "text", required: true, maxLength: 60, autocomplete: "name", always: true },
  { id: "service", label: "Какая услуга нужна", summaryLabel: "Что нужно",
    type: "select", required: true, optionsFrom: "orders", always: true },

  /* --- создание сайтов: расширенный бриф сохранён --- */
  { id: "business", label: "Чем вы занимаетесь", summaryLabel: "Чем занимается бизнес",
    type: "textarea", required: true, maxLength: 500, services: ["landing", "card", "custom"],
    hint: "Пара предложений: что вы делаете и для кого." },
  { id: "goal", label: "Главная цель сайта", summaryLabel: "Цель сайта",
    type: "select", required: true, services: ["landing", "card", "custom"],
    options: ["Получать заявки и обращения", "Показать услуги и цены", "Принимать записи онлайн",
              "Продавать товары", "Рассказать о себе или компании", "Другое"] },
  { id: "audience", label: "Кто ваши клиенты", summaryLabel: "Клиенты",
    type: "textarea", required: false, maxLength: 300, services: ["landing", "card", "custom"] },
  { id: "materials", label: "Что у вас уже есть", summaryLabel: "Что уже есть",
    type: "checkboxes", required: false, services: ["landing", "card", "custom"],
    options: ["Тексты", "Логотип", "Фотографии", "Фирменные цвета", "Домен", "Хостинг", "Пока ничего нет"] },
  { id: "examples", label: "Сайты, которые вам нравятся", summaryLabel: "Примеры сайтов",
    type: "textarea", required: false, maxLength: 300, services: ["landing", "card", "custom"],
    hint: "Ссылки и что именно понравилось." },

  /* --- видеомонтаж --- */
  { id: "videoType", label: "Что нужно смонтировать", summaryLabel: "Тип работы",
    type: "select", required: true, services: ["video"],
    options: ["Короткий ролик для социальных сетей", "Нарезка из исходного материала", "Монтаж с титрами и переходами", "Другое"] },
  { id: "videoPlatform", label: "Где будет опубликован ролик", summaryLabel: "Площадка",
    type: "text", required: false, maxLength: 80, services: ["video"],
    hint: "Название площадки или «пока не знаю»." },
  { id: "videoDuration", label: "Примерная длительность", summaryLabel: "Длительность",
    type: "text", required: false, maxLength: 40, services: ["video"],
    hint: "Например, до минуты." },
  { id: "videoSource", label: "Что у вас уже есть", summaryLabel: "Что уже есть",
    type: "checkboxes", required: false, services: ["video"],
    options: ["Исходные видео", "Музыка", "Логотип", "Тексты для титров", "Пока ничего нет"] },

  /* --- графический дизайн --- */
  { id: "designType", label: "Что нужно сделать", summaryLabel: "Тип работы",
    type: "select", required: true, services: ["design"],
    options: ["Карточки товаров для маркетплейсов", "Баннеры", "Визуалы для социальных сетей", "Другое"] },
  { id: "designFormat", label: "Размеры или формат", summaryLabel: "Формат",
    type: "text", required: false, maxLength: 80, services: ["design"],
    hint: "Если знаете. Если нет, оставьте поле пустым." },
  { id: "designCount", label: "Сколько изображений нужно", summaryLabel: "Количество",
    type: "text", required: false, maxLength: 40, services: ["design"] },
  { id: "designSource", label: "Что у вас уже есть", summaryLabel: "Что уже есть",
    type: "checkboxes", required: false, services: ["design"],
    options: ["Логотип", "Фирменные цвета", "Шрифты", "Фото товара или материалы", "Примеры, которые нравятся", "Пока ничего нет"] },

  /* --- видеомонтаж и дизайн: описание --- */
  { id: "description", label: "Описание проекта", summaryLabel: "Описание",
    type: "textarea", required: true, maxLength: 500, services: ["video", "design"],
    hint: "Что нужно сделать и для кого." },

  /* --- для любой услуги --- */
  { id: "budget", label: "Желаемый бюджет", summaryLabel: "Бюджет",
    type: "text", required: false, maxLength: 60,
    hint: "Необязательно. Можно указать диапазон." },
  { id: "deadline", label: "Когда нужен результат", summaryLabel: "Срок",
    type: "select", required: false, options: DEADLINES },
  { id: "scope", label: "Параметры проекта и пожелания", summaryLabel: "Параметры проекта",
    type: "textarea", required: false, maxLength: 600, always: true,
    hint: "Необязательно. Если вы пришли из конструктора сайта, параметры появятся здесь автоматически." },
  { id: "contact", label: "Как с вами связаться", summaryLabel: "Связь",
    type: "text", required: true, maxLength: 80,
    hint: "Обязательно: @Telegram, телефон или e-mail. Иначе мы не сможем ответить." }
];

/* =====================================================================
   ЧИСТАЯ ЛОГИКА (без страницы)
   ===================================================================== */
function optionById(id) {
  var list = getOrderOptions();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
function isVisible(f, svc) {
  if (f.always) return true;
  if (!svc) return false;
  return !f.services || f.services.indexOf(svc) !== -1;
}

function createSubmissionTracker(makeId) {
  var currentId = null;
  var currentPayload = null;
  return {
    idFor: function (payload) {
      if (!currentId || currentPayload !== payload) {
        currentId = makeId();
        currentPayload = payload;
      }
      return currentId;
    },
    reset: function () {
      currentId = null;
      currentPayload = null;
    }
  };
}

// Убираем «одинокие» половинки эмодзи (иначе encodeURIComponent выдаёт ошибку).
function stripLoneSurrogates(s) {
  s = String(s);
  var out = "";
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF) {
      var n = s.charCodeAt(i + 1);
      if (n >= 0xDC00 && n <= 0xDFFF) { out += s.charAt(i) + s.charAt(i + 1); i++; }
    } else if (!(c >= 0xDC00 && c <= 0xDFFF)) {
      out += s.charAt(i);
    }
  }
  return out;
}

// Ссылка на Telegram. Если текст пустой, получится просто ссылка на чат.
function telegramUrl(text) {
  var base = "https://t.me/" + CONFIG.telegram.username;
  if (!text) return base;
  var safe = stripLoneSurrogates(text);
  try { return base + "?text=" + encodeURIComponent(safe); } catch (e) { return base; }
}

// Короткое сообщение для кнопок быстрого заказа.
function buildQuickMessage(id) {
  return "Здравствуйте! Хочу заказать " + optionById(id).kind + ". Меня зовут ";
}

function cleanText(value, maxLength) {
  var v = String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .replace(/\s*\n\s*/g, " ")   // каждый ответ в одну строку: проще разбирать ботом
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  if (maxLength && v.length > maxLength) {
    v = v.slice(0, maxLength);
    var last = v.charCodeAt(v.length - 1);
    if (last >= 0xD800 && last <= 0xDBFF) v = v.slice(0, -1);   // не оставляем половину эмодзи
    v = v.trim();
  }
  return v;
}

// Сырые значения формы -> аккуратный бриф. Поля, не относящиеся к услуге, обнуляются.
function normalizeBrief(raw) {
  var brief = {};
  var svc = cleanText(raw.service, 20);
  var known = optionById(svc) ? svc : "";
  BRIEF_SCHEMA.forEach(function (f) {
    var v = raw[f.id];
    var show = isVisible(f, known);
    if (f.type === "checkboxes") {
      brief[f.id] = show ? (Array.isArray(v) ? v : []).filter(function (x) { return f.options.indexOf(x) !== -1; }) : [];
    } else {
      brief[f.id] = show || f.id === "service" ? cleanText(v, f.maxLength) : "";
    }
  });
  return brief;
}

// Возвращает {id поля: текст ошибки}. Проверяются только видимые поля.
function validateBrief(brief) {
  var errors = {};
  var svc = optionById(brief.service) ? brief.service : "";
  BRIEF_SCHEMA.forEach(function (f) {
    if (!isVisible(f, svc)) return;
    var v = brief[f.id];
    var empty = Array.isArray(v) ? v.length === 0 : !v;
    if (f.required && empty) { errors[f.id] = f.type === "select" ? "Выберите вариант" : "Заполните это поле"; return; }
    if (f.id === "name" && !empty && v.length < 2) { errors[f.id] = "Укажите имя: минимум 2 символа"; return; }
    if (f.id === "contact" && !empty && v.length < 4) { errors[f.id] = "Укажите контакт для ответа"; return; }
    if (f.type === "select" && !empty) {
      var allowed = f.optionsFrom === "orders" ? CONFIG.orderOptions : f.options;
      if (allowed.indexOf(v) === -1) errors[f.id] = "Выберите вариант из списка";
    }
  });
  return errors;
}

function submissionErrorMessage(status) {
  if (status === 400) return "Проверьте данные: имя — минимум 2 символа, контакт — минимум 4. Исправьте поля и составьте бриф ещё раз.";
  if (status === 429) return "Слишком много заявок за короткое время. Попробуйте позже или свяжитесь с нами через Telegram.";
  return "Не удалось отправить заявку. Попробуйте ещё раз или отправьте её через Telegram.";
}

function formatValue(f, v) {
  if (Array.isArray(v)) return v.join(", ");
  if (f.optionsFrom === "orders") { var o = optionById(v); return o ? o.title : ""; }
  return v || "";
}

function groupTitle(group) {
  return CONFIG.services[group] ? CONFIG.services[group].title : "";
}

// Бриф -> текст сообщения. Пустые необязательные поля пропускаются.
function buildMessage(brief) {
  var lines = ["Здравствуйте! Отправляю бриф с сайта.", "", CONFIG.brief.header];
  var svc = optionById(brief.service);
  if (svc) lines.push("Направление: " + groupTitle(svc.group));
  var known = svc ? svc.id : "";
  BRIEF_SCHEMA.forEach(function (f) {
    if (!isVisible(f, known)) return;
    var v = formatValue(f, brief[f.id]);
    if (v) lines.push(f.summaryLabel + ": " + v);
  });
  return lines.join("\n");
}

function copyText(text, el) {
  function legacy() {   // старый способ: выделить текст в поле и скопировать
    try { el.focus(); el.select(); el.setSelectionRange(0, text.length); return document.execCommand("copy"); }
    catch (e) { return false; }
  }
  if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(function () { return true; }, legacy);
  }
  return Promise.resolve(legacy());
}

/* =====================================================================
   ПРЕДОПЛАТА: полностью выключена. Код сохранён для будущего подключения.
   Пока ссылка пуста или не https, блок скрыт и заблокирован.
   ===================================================================== */
function initPrepay($) {
  var wrap = $("prepay-wrap"), box = $("prepay-box"), pay = $("prepay");
  var ok = $("prepay-ok"), okLabel = $("prepay-ok-label"), hint = $("prepay-hint");
  if (!box || !pay) return;
  function setLocked(locked) {
    if (locked) {
      pay.removeAttribute("href");
      pay.setAttribute("tabindex", "0");
      pay.setAttribute("role", "button");
      pay.setAttribute("aria-disabled", "true");
      if (hint) hint.textContent = "Кнопка станет активной после отметки выше.";
    } else {
      pay.href = CONFIG.prepay.url;
      pay.removeAttribute("tabindex");
      pay.removeAttribute("role");
      pay.removeAttribute("aria-disabled");
      if (hint) hint.textContent = "Платёжная страница откроется в новой вкладке.";
    }
  }
  pay.addEventListener("click", function (e) {
    if (pay.getAttribute("aria-disabled") === "true" || !pay.getAttribute("href")) e.preventDefault();
  });
  var valid = /^https:\/\//.test(CONFIG.prepay.url || "");
  if (!CONFIG.prepay.enabled || !valid) {
    (wrap || box).hidden = true;
    setLocked(true);
    if (ok) ok.disabled = true;
    return;
  }
  (wrap || box).hidden = false;
  if (!CONFIG.prepay.requireConfirm || !ok) { if (okLabel) okLabel.hidden = true; setLocked(false); }
  else { ok.checked = false; setLocked(true); ok.addEventListener("change", function () { setLocked(!ok.checked); }); }
}

/* =====================================================================
   СТРАНИЦА ЗАКАЗА
   ===================================================================== */
function initOrderPage() {
  var $ = function (id) { return document.getElementById(id); };
  var form = $("brief-form"), fields = $("brief-fields");
  var preview = $("brief-preview"), result = $("brief-result");
  var send = $("brief-send"), status = $("brief-status"), formError = $("brief-error");
  var submitLead = $("brief-submit");
  initPrepay($);
  if (!form || !fields || !preview || !result || !send || !status || !formError || !$("brief-copy") || !submitLead) return;

  function el(tag, props, text) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) { n.setAttribute(k, props[k]); });
    if (text) n.textContent = text;
    return n;
  }

  // Кнопки быстрого заказа: готовое сообщение, как раньше.
  document.querySelectorAll(".order").forEach(function (a) {
    var o = optionById(a.getAttribute("data-service"));
    if (!o) return;
    a.textContent = o.buttonText;
    a.href = telegramUrl(buildQuickMessage(o.id));
  });

  function clearError(id) {
    var err = $("err-" + id);
    if (err) { err.hidden = true; err.textContent = ""; }
    form.querySelectorAll('[name="' + id + '"]').forEach(function (c) { c.removeAttribute("aria-invalid"); });
    refreshSummary();
  }
  function refreshSummary() {
    var left = fields.querySelectorAll(".err:not([hidden])").length;
    if (!left) formError.hidden = true;
    else formError.textContent = "Проверьте поля, отмеченные красным: не заполнено " + left + ".";
  }

  BRIEF_SCHEMA.forEach(function (f) {
    var wrap = el("div", { "class": "field", id: "wrap-" + f.id });
    var control;
    if (f.type === "checkboxes") {
      control = el("fieldset");
      var legend = el("legend", {}, f.label);
      legend.appendChild(el("span", { "class": "req" }, " (необязательно)"));
      control.appendChild(legend);
      f.options.forEach(function (opt) {
        var l = el("label", { "class": "check" });
        l.appendChild(el("input", { type: "checkbox", name: f.id, value: opt }));
        l.appendChild(el("span", {}, opt));
        control.appendChild(l);
      });
      wrap.appendChild(control);
    } else {
      var attrs = { id: "f-" + f.id, name: f.id };
      if (f.maxLength) attrs.maxlength = f.maxLength;
      if (f.autocomplete) attrs.autocomplete = f.autocomplete;
      if (f.required) attrs["aria-required"] = "true";
      attrs["aria-describedby"] = (f.hint ? "hint-" + f.id + " " : "") + "err-" + f.id;
      if (f.type === "select") {
        control = el("select", attrs);
        control.appendChild(el("option", { value: "" }, "Выберите…"));
        var opts = f.optionsFrom === "orders"
          ? getOrderOptions().map(function (o) { return [o.id, o.title]; })
          : f.options.map(function (o) { return [o, o]; });
        opts.forEach(function (o) { control.appendChild(el("option", { value: o[0] }, o[1])); });
      } else if (f.type === "textarea") control = el("textarea", attrs);
      else { attrs.type = "text"; control = el("input", attrs); }
      var label = el("label", { "for": "f-" + f.id }, f.label);
      if (!f.required) label.appendChild(el("span", { "class": "req" }, " (необязательно)"));
      if (f.hint) label.appendChild(el("span", { "class": "hint", id: "hint-" + f.id }, f.hint));
      wrap.appendChild(label);
      wrap.appendChild(control);
    }
    var err = el("p", { "class": "err", id: "err-" + f.id });
    err.hidden = true;
    wrap.appendChild(err);
    wrap.addEventListener(f.type === "select" || f.type === "checkboxes" ? "change" : "input", function () { clearError(f.id); });
    fields.appendChild(wrap);
  });

  function currentService() {
    var v = $("f-service").value;
    return optionById(v) ? v : "";
  }
  // Показываем только поля выбранной услуги; скрытые не проверяются и не попадают в сообщение.
  function updateVisibility() {
    var svc = currentService();
    BRIEF_SCHEMA.forEach(function (f) {
      var show = isVisible(f, svc);
      $("wrap-" + f.id).hidden = !show;
      if (!show) clearError(f.id);
    });
    var sh = $("service-hint");
    if (sh) sh.hidden = !!svc;
  }
  $("f-service").addEventListener("change", function () { updateVisibility(); result.hidden = true; });

  function readForm() {
    var raw = {};
    BRIEF_SCHEMA.forEach(function (f) {
      if (f.type === "checkboxes") {
        raw[f.id] = Array.prototype.map.call(form.querySelectorAll('input[name="' + f.id + '"]:checked'), function (c) { return c.value; });
      } else raw[f.id] = form.elements[f.id] ? form.elements[f.id].value : "";
    });
    return normalizeBrief(raw);
  }

  function updateSendLink() {
    var url = telegramUrl(preview.value);
    var tooLong = url.length > CONFIG.telegram.maxUrlLength;
    send.setAttribute("data-long", tooLong ? "true" : "false");
    send.href = tooLong ? telegramUrl("") : url;   // длинный текст в ссылку не кладём
    return tooLong;
  }
  preview.addEventListener("input", updateSendLink);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var brief = readForm();
    var errors = validateBrief(brief);
    var ids = Object.keys(errors);
    BRIEF_SCHEMA.forEach(function (f) { clearError(f.id); });
    if (ids.length) {
      ids.forEach(function (id) {
        var err = $("err-" + id);
        err.textContent = errors[id];
        err.hidden = false;
        form.querySelectorAll('[name="' + id + '"]').forEach(function (c) { c.setAttribute("aria-invalid", "true"); });
      });
      formError.textContent = "Проверьте поля, отмеченные красным: не заполнено " + ids.length + ".";
      formError.hidden = false;
      result.hidden = true;
      var first = form.querySelector('[name="' + ids[0] + '"]');
      if (first) first.focus();
      return;
    }
    formError.hidden = true;
    preview.value = buildMessage(brief);
    result.hidden = false;
    var long = updateSendLink();
    status.textContent = "Проверьте текст и нажмите «Отправить заявку».";
    submitLead.disabled = false;
    submitLead.textContent = "Отправить заявку";
    result.scrollIntoView({ block: "nearest" });
  });


  // Публичная форма GitHub Pages: прием на выделенный Supabase endpoint студии.
  // Секреты и доступ к базе находятся только на сервере. Повтор не создаёт дубли.
  var submissionTracker = createSubmissionTracker(function () { return crypto.randomUUID(); });
  submitLead.addEventListener("click", async function () {
    var message = preview.value.trim();
    var brief = readForm();
    if (!message) {
      status.textContent = "Сначала составьте бриф.";
      return;
    }
    var errors = validateBrief(brief);
    if (Object.keys(errors).length) {
      status.textContent = "Проверьте обязательные поля, затем составьте бриф ещё раз.";
      Object.keys(errors).forEach(function (id) {
        var err = document.getElementById("err-" + id);
        err.textContent = errors[id];
        err.hidden = false;
        form.querySelectorAll('[name="' + id + '"]').forEach(function (c) { c.setAttribute("aria-invalid", "true"); });
      });
      result.hidden = true;
      form.scrollIntoView({ block: "start" });
      return;
    }
    var chosen = optionById(brief.service);
    var serviceName = chosen ? chosen.title : brief.service;
    var submissionPayload = JSON.stringify([brief.name, serviceName, brief.contact, message]);
    var siteSubmissionId = submissionTracker.idFor(submissionPayload);
    submitLead.disabled = true;
    submitLead.textContent = "Отправляем…";
    status.textContent = "Отправляем…";
    try {
      var response = await fetch("https://aysvovhvsttfjfhigbjt.supabase.co/functions/v1/sws-public-site-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brief.name,
          service: serviceName,
          contact: brief.contact,
          message: message,
          source: location.pathname,
          _request_id: siteSubmissionId,
          website: form.elements.website ? form.elements.website.value : ""
        })
      });
      var answer = await response.json().catch(function () { return null; });
      if (!response.ok || !answer || answer.ok !== true) {
        var requestError = new Error("Lead submission failed");
        requestError.status = response.status;
        throw requestError;
      }
      status.textContent = "✅ Заявка отправлена! Мы свяжемся с вами по указанному контакту.";
      submitLead.textContent = "Заявка отправлена ✓";
      submissionTracker.reset();
      removeDraft("Черновик удалён после успешной отправки.");
    } catch (err) {
      // Клиенту показываем только понятный результат, а не внутренние сообщения сервера.
      status.textContent = submissionErrorMessage(err.status);
      submitLead.disabled = false;
      submitLead.textContent = "Повторить отправку";
    }
  });

  send.addEventListener("click", function () {
    if (updateSendLink()) {
      copyText(preview.value, preview).then(function (ok) {
        status.textContent = ok
          ? "Текст скопирован. В Telegram вставьте его в чат (долгое нажатие, затем «Вставить»)."
          : "Не удалось скопировать автоматически. Выделите текст выше и скопируйте его вручную.";
      });
    }
  });
  $("brief-copy").addEventListener("click", function () {
    copyText(preview.value, preview).then(function (ok) {
      status.textContent = ok
        ? "Текст скопирован. Вставьте его в чат с @" + CONFIG.telegram.username + "."
        : "Не удалось скопировать автоматически. Текст выделен: скопируйте его вручную (Ctrl+C или долгое нажатие).";
    });
  });

  // Параметр service заранее выбирает услугу. Недопустимое значение игнорируется.
  var params = new URLSearchParams(location.search);
  var requestedService = params.get("service");
  if (requestedService && optionById(requestedService)) $("f-service").value = requestedService;
  updateVisibility();

  // Помощник на странице услуг может передать контекст в бриф (без пользовательского кода/HTML).
  var noteFromGuide = params.get("briefNote");
  if (noteFromGuide) {
    noteFromGuide = cleanText(noteFromGuide, 450);
    var target = (currentService() === "video" || currentService() === "design") ? $("f-description") : $("f-business");
    if (target && !target.value) target.value = noteFromGuide;
  }

  // Автосохранение включается только явным согласием посетителя. Черновик хранится локально в браузере.
  var DRAFT_KEY = "siteworksstudio-brief-draft-v1";
  var saveDraftToggle = $("brief-save-draft");
  var draftStatus = $("brief-draft-status");
  var clearDraftButton = $("brief-clear-draft");

  function setDraftStatus(text) { if (draftStatus) draftStatus.textContent = text; }
  function draftValues() {
    var values = {};
    BRIEF_SCHEMA.forEach(function (f) {
      if (f.type === "checkboxes") {
        values[f.id] = Array.prototype.map.call(form.querySelectorAll('input[name="' + f.id + '"]:checked'), function (c) { return c.value; });
      } else values[f.id] = form.elements[f.id] ? form.elements[f.id].value : "";
    });
    return values;
  }
  function saveDraft() {
    if (!saveDraftToggle || !saveDraftToggle.checked) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), values: draftValues() }));
      setDraftStatus("Черновик сохранён на этом устройстве. Он не отправляется на сервер, пока вы не нажмёте «Отправить заявку».");
    } catch (e) {
      setDraftStatus("Браузер не разрешил сохранить черновик. Продолжайте заполнять форму — отправка заявки работает отдельно.");
    }
  }
  function removeDraft(message) {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    if (saveDraftToggle) saveDraftToggle.checked = false;
    if (message) setDraftStatus(message);
  }
  function restoreDraft(data) {
    if (!data || data.version !== 1 || !data.values || typeof data.values !== "object") return false;
    BRIEF_SCHEMA.forEach(function (f) {
      var value = data.values[f.id];
      if (f.type === "checkboxes") {
        var selected = Array.isArray(value) ? value : [];
        form.querySelectorAll('input[name="' + f.id + '"]').forEach(function (c) { c.checked = selected.indexOf(c.value) !== -1; });
      } else if (form.elements[f.id] && typeof value === "string") {
        form.elements[f.id].value = value;
      }
    });
    updateVisibility();
    setDraftStatus("Сохранённый черновик восстановлен. Перед отправкой проверьте ответы.");
    return true;
  }

  if (saveDraftToggle) {
    saveDraftToggle.addEventListener("change", function () {
      if (saveDraftToggle.checked) saveDraft();
      else removeDraft("Сохранённый черновик удалён. Текущие поля остаются на странице, но больше не сохраняются автоматически.");
    });
    form.addEventListener("input", function (e) { if (e.target && e.target.id !== "brief-preview") saveDraft(); });
    form.addEventListener("change", function () { saveDraft(); });
  }
  if (clearDraftButton) clearDraftButton.addEventListener("click", function () {
    removeDraft("Сохранённый черновик удалён. Текущие поля остаются на странице.");
  });
  try {
    var storedDraft = localStorage.getItem(DRAFT_KEY);
    if (storedDraft && restoreDraft(JSON.parse(storedDraft))) {
      if (saveDraftToggle) saveDraftToggle.checked = true;
    } else if (!storedDraft) {
      setDraftStatus("Черновик не сохраняется. Включите опцию выше, чтобы продолжить позже.");
    }
  } catch (e) {
    setDraftStatus("Не удалось восстановить черновик. Проверьте поля и продолжайте заполнять форму.");
  }

  // Параметры из конструктора — отдельное редактируемое поле.
  // Не затрагиваем ответы на вопросы о бизнесе или описание проекта.
  var scopeFromEstimator = params.get("scope");
  if (scopeFromEstimator && $("f-scope")) {
    $("f-scope").value = cleanText(scopeFromEstimator, 550);
  }

  // Экспорт брифа в обычный TXT: удобно сохранить или приложить к переписке.
  var downloadButton = $("brief-download");
  if (downloadButton) downloadButton.addEventListener("click", function () {
    var text = preview.value.trim();
    if (!text) { status.textContent = "Сначала составьте бриф."; return; }
    try {
      var blob = new Blob(["\uFEFF", text, "\n"], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = el("a", { href: url, download: "SiteWorksStudio-brief-" + new Date().toISOString().slice(0, 10) + ".txt", hidden: "hidden" });
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      status.textContent = "Бриф скачан в формате TXT.";
    } catch (e) { status.textContent = "Не удалось скачать файл. Скопируйте текст вручную."; }
  });
}

if (typeof document !== "undefined" && document.getElementById("brief-form")) initOrderPage();
