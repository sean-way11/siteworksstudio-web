/* site.js: общее для всех страниц. Нужен config.js (CONFIG) перед ним. */
(function () {
  "use strict";
  var KEY = (window.SW_THEME && window.SW_THEME.key) || "sw-theme";
  var ICON = {
    sun: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
  };

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  }
  function getByPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  /* Официальный знак бренда используется в шапке и подвале.
     Favicon намеренно отдельный и компактный — только буква S. */
  function makeBrandLogo() {
    var link = el("a", { "class": "logo", href: "index.html", "aria-label": CONFIG.studio.name });
    var mark = el("img", {
      "class": "brand-mark",
      src: "assets/img/siteworksstudio-logo.png",
      alt: "",
      "aria-hidden": "true",
      width: "64",
      height: "37",
      decoding: "async"
    });
    link.appendChild(mark);
    link.appendChild(el("span", {}, CONFIG.studio.name));
    return link;
  }

  /* ---------- Тема ---------- */
  function storageOK() {
    try { localStorage.setItem("sw-probe", "1"); localStorage.removeItem("sw-probe"); return true; } catch (e) { return false; }
  }
  function currentTheme() { return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"; }
  function applyTheme(t, save) {
    document.documentElement.setAttribute("data-theme", t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "light" ? "#F6F8FC" : "#0E1014");
    if (save) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    var b = document.getElementById("theme-toggle");
    if (b) {
      b.innerHTML = t === "light" ? ICON.moon : ICON.sun;
      b.setAttribute("aria-label", t === "light" ? "Включить тёмную тему" : "Включить светлую тему");
    }
  }

  /* ---------- Шапка и меню ---------- */
  function buildHeader() {
    var host = document.getElementById("site-header");
    if (!host) return;
    var page = document.body.getAttribute("data-page");
    host.textContent = "";
    var inner = el("div", { "class": "header-in" });
    inner.appendChild(makeBrandLogo());

    var burger = el("button", { type: "button", "class": "icon-btn nav-toggle", "aria-expanded": "false", "aria-controls": "site-nav", "aria-label": "Открыть меню" });
    burger.innerHTML = ICON.menu;
    inner.appendChild(burger);

    var nav = el("nav", { "class": "site-nav", id: "site-nav", "aria-label": "Основная навигация" });
    var ul = el("ul", { "class": "nav-list" });
    CONFIG.nav.forEach(function (item) {
      var li = el("li", { "class": item.children ? "has-sub" : "" });
      var a = el("a", { href: item.href }, item.label);
      if (item.id === page) a.setAttribute("aria-current", "page");
      if (item.children) {
        var split = el("div", { "class": "split" });
        split.appendChild(a);
        var sid = "sub-" + item.id;
        var sb = el("button", { type: "button", "class": "sub-toggle", "aria-expanded": "false", "aria-controls": sid, "aria-label": "Показать направления: " + item.label });
        sb.innerHTML = ICON.chev;
        split.appendChild(sb);
        li.appendChild(split);
        var sub = el("ul", { "class": "sub-list", id: sid });
        sub.hidden = true;
        item.children.forEach(function (c) {
          var sli = el("li");
          sli.appendChild(el("a", { href: c.href }, c.label));
          sub.appendChild(sli);
        });
        li.appendChild(sub);
      } else li.appendChild(a);
      ul.appendChild(li);
    });
    var cta = el("li", { "class": "nav-cta" });
    cta.appendChild(el("a", { "class": "btn", href: CONFIG.cta.href }, CONFIG.cta.label));
    ul.appendChild(cta);
    nav.appendChild(ul);
    inner.appendChild(nav);

    var tb = el("button", { type: "button", "class": "icon-btn theme-toggle", id: "theme-toggle" });
    inner.appendChild(tb);
    host.appendChild(inner);
    applyTheme(currentTheme(), false);
    tb.addEventListener("click", function () { applyTheme(currentTheme() === "light" ? "dark" : "light", true); });

    /* --- поведение меню --- */
    var desktop = window.matchMedia("(min-width:1180px)");
    function subs() { return Array.prototype.slice.call(nav.querySelectorAll(".sub-toggle")); }
    function setSub(btn, open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.getElementById(btn.getAttribute("aria-controls")).hidden = !open;
    }
    function closeSubs() { subs().forEach(function (b) { setSub(b, false); }); }
    function setMenu(open) {
      nav.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    }
    function closeAll() { closeSubs(); setMenu(false); }
    burger.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    subs().forEach(function (b) {
      b.addEventListener("click", function () {
        var willOpen = b.getAttribute("aria-expanded") !== "true";
        closeSubs();
        setSub(b, willOpen);
      });
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) closeAll();
    });
    document.addEventListener("click", function (e) {
      if (!inner.contains(e.target)) closeAll();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" && e.key !== "Esc") return;
      var openSub = subs().filter(function (b) { return b.getAttribute("aria-expanded") === "true"; })[0];
      if (openSub) { setSub(openSub, false); openSub.focus(); return; }
      if (nav.classList.contains("open")) { setMenu(false); burger.focus(); }
    });
    document.addEventListener("focusin", function (e) {   // на компьютере подменю закрывается, когда фокус ушёл из него
      if (!desktop.matches) return;
      subs().forEach(function (b) {
        if (b.getAttribute("aria-expanded") === "true" && !b.parentNode.parentNode.contains(e.target)) setSub(b, false);
      });
    });
    var onChange = function () { closeAll(); };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange); else desktop.addListener(onChange);
  }

  /* ---------- Техническое обновление: единое уведомление на всех страницах ---------- */
  function buildSiteNotice() {
    var notice = CONFIG.siteNotice;
    var header = document.getElementById("site-header");
    if (!header || !notice || !notice.enabled || !notice.message) return;
    var key = "sws-notice-dismissed-" + String(notice.id || "current");
    try { if (sessionStorage.getItem(key) === "1") return; } catch (e) {}
    var banner = el("aside", {
      "class": "sws-tech-notice",
      id: "sws-tech-notice",
      "aria-label": "Информация об обновлении сайта"
    });
    var inner = el("div", { "class": "container sws-tech-notice-inner" });
    var message = el("div", { "class": "sws-tech-notice-copy" });
    message.appendChild(el("span", { "class": "sws-tech-notice-label" }, String(notice.label || "ОБНОВЛЕНИЕ")));
    message.appendChild(el("span", { "class": "sws-tech-notice-text" }, String(notice.message)));
    inner.appendChild(message);
    if (notice.href && notice.linkLabel) {
      inner.appendChild(el("a", { "class": "sws-tech-notice-link", href: String(notice.href) }, String(notice.linkLabel) + " ↗"));
    }
    var dismiss = el("button", {
      type: "button", "class": "sws-tech-notice-close",
      "aria-label": "Скрыть уведомление об обновлении"
    }, "×");
    dismiss.addEventListener("click", function () {
      banner.remove();
      try { sessionStorage.setItem(key, "1"); } catch (e) {}
    });
    inner.appendChild(dismiss);
    banner.appendChild(inner);
    header.insertAdjacentElement("afterend", banner);
  }

  /* ---------- Подвал ---------- */
  function buildFooter() {
    var host = document.getElementById("site-footer");
    if (!host) return;
    host.textContent = "";
    var wrap = el("div", { "class": "container footer-grid" });
    var c1 = el("div");
    c1.appendChild(makeBrandLogo());
    c1.appendChild(el("p", {}, CONFIG.studio.tagline));
    wrap.appendChild(c1);

    var c2 = el("nav", { "aria-label": "Страницы сайта" });
    c2.appendChild(el("p", { "class": "foot-h" }, "Страницы"));
    var ul = el("ul", { "class": "foot-list" });
    CONFIG.nav.forEach(function (item) {
      var li = el("li"); li.appendChild(el("a", { href: item.href }, item.label)); ul.appendChild(li);
    });
    c2.appendChild(ul);
    wrap.appendChild(c2);

    var c3 = el("div");
    c3.appendChild(el("p", { "class": "foot-h" }, "Связь"));
    var p = el("p"), a = el("a", { href: "https://t.me/" + CONFIG.telegram.username, target: "_blank", rel: "noopener noreferrer" }, "Telegram @" + CONFIG.telegram.username);
    p.appendChild(a); c3.appendChild(p);
    c3.appendChild(el("p", { "class": "note" }, "Используйте форму заказа для отправки брифа. Если автоматическая отправка временно недоступна, сайт предложит открыть Telegram вручную или скопировать текст."));
    wrap.appendChild(c3);
    host.appendChild(wrap);
  }

  /* ---------- Подстановка значений из CONFIG ---------- */
  function fillConfig() {
    document.querySelectorAll("[data-cfg]").forEach(function (n) {
      var v = getByPath(CONFIG, n.getAttribute("data-cfg"));
      if (v != null) n.textContent = v;   // если пути нет, остаётся запасной текст из разметки
    });
  }

  /* ---------- Резерв: тема в адресе, если localStorage недоступен ---------- */
  function propagateTheme() {
    if (storageOK() || currentTheme() !== "light") return;
    document.querySelectorAll("a[href]").forEach(function (a) {
      var h = a.getAttribute("href");
      if (!/\.html(\?|#|$)/.test(h) || /^[a-z]+:/i.test(h)) return;
      var hashAt = h.indexOf("#"), hash = hashAt >= 0 ? h.slice(hashAt) : "", base = hashAt >= 0 ? h.slice(0, hashAt) : h;
      if (/[?&]theme=/.test(base)) return;
      a.setAttribute("href", base + (base.indexOf("?") >= 0 ? "&" : "?") + "theme=light" + hash);
    });
  }

  function init() {
    buildHeader();
    buildSiteNotice();
    buildFooter();
    fillConfig();
    propagateTheme();
    window.addEventListener("storage", function (e) {   // синхронизация между вкладками
      if (e.key === KEY && (e.newValue === "light" || e.newValue === "dark")) applyTheme(e.newValue, false);
    });
  }
  if (typeof document !== "undefined") init();
})();
