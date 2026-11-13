/* SiteWorksStudio Project Builder: estimate from published CONFIG only; no invented extra prices. */
(function () {
  "use strict";
  var root=document.getElementById("quote-builder");
  if (!root || typeof CONFIG==="undefined" || !CONFIG.tariffs) return;
  var byId=function(id){ return document.getElementById(id); };
  var service=byId("quote-service"),materials=byId("quote-materials"),deadline=byId("quote-deadline"),comment=byId("quote-comment");
  var action=byId("quote-create"),result=byId("quote-result"),price=byId("quote-price");
  var time=byId("quote-time"),details=byId("quote-output"),go=byId("quote-brief");
  var copy=byId("quote-copy"),download=byId("quote-download"),status=byId("quote-status");
  if(!service||!materials||!deadline||!comment||!action||!result||!price||!time||!details||!go||!copy||!download||!status)return;
  var groups=Array.prototype.slice.call(root.querySelectorAll("[data-quote-scope]"));
  var serviceLabels={landing:"Лендинг",card:"Сайт-визитка",custom:"Индивидуальный сайт",video:"Видеомонтаж",design:"Графический дизайн"};
  var featureLabels={
    contact:"Форма обратной связи",seo:"Базовая SEO-подготовка",booking:"Онлайн-запись",
    catalog:"Каталог или магазин",integration:"Интеграция с внешними сервисами",
    captions:"Субтитры",music:"Музыка и ритм",motion:"Анимация и графика",
    formats:"Версии для разных площадок",marketplace:"Карточки маркетплейсов",
    banners:"Рекламные баннеры",social:"Графика для соцсетей",identity:"Фирменный стиль"
  };
  var complex=["booking","catalog","integration"];
  var data=null;
  function getScope(id){return ["landing","card","custom"].indexOf(id)!==-1?"web":id;}
  function selections(scope){
    return Array.prototype.slice.call(root.querySelectorAll('[data-quote-scope="'+scope+'"] input[type="checkbox"]:checked'))
      .map(function(x){return featureLabels[x.value]||""}).filter(Boolean);
  }
  function values(){
    var chosen=service.value;
    var scope=getScope(chosen);
    var features=Array.prototype.slice.call(root.querySelectorAll('[data-quote-scope="'+scope+'"] input[type="checkbox"]:checked'));
    var advanced=scope==="web" && features.some(function(x){return complex.indexOf(x.value)!==-1;});
    var effective=advanced?"custom":chosen;
    var tariff=CONFIG.tariffs[effective]||null;
    var estimate=(tariff && tariff.priced)?tariff.price:"По согласованию";
    var period=(tariff && tariff.priced && tariff.deadline)?"Ориентировочно "+tariff.deadline:"После уточнения задачи";
    var opts=selections(scope);
    var materialsText=materials.options[materials.selectedIndex].textContent.trim();
    var deadlineText=deadline.options[deadline.selectedIndex].textContent.trim();
    var note=comment.value.trim().replace(/\s+/g," ").slice(0,160);
    var shortNote=[
      "Формат: "+serviceLabels[chosen],
      opts.length?"Пожелания: "+opts.join(", "):"",
      "Материалы: "+materialsText,
      "Желаемый срок: "+deadlineText,
      note?"Дополнительно: "+note:""
    ].filter(Boolean).join("; ");
    var text=[
      "SiteWorksStudio — предварительный расчёт",
      "",
      "Услуга: "+serviceLabels[chosen],
      advanced?"Тип проекта: индивидуальный (нужны расширенные функции)":"",
      "Стоимость: "+estimate,
      "Срок выполнения: "+period,
      opts.length?"Пожелания: "+opts.join(", "):"Дополнительные функции: уточним вместе",
      "Материалы: "+materialsText,
      "Желаемый срок: "+deadlineText,
      note?"Комментарий: "+note:"",
      "",
      "Ориентир, не итоговая смета: цена и сроки уточняются после брифа.",
      "https://siteworksstudio.ru/order.html"
    ].filter(function(x){return x!=="";}).join("\n");
    return {service:effective,estimate:estimate,period:period,advanced:advanced,
      note:shortNote.slice(0,445),text:text};
  }
  function showScope(){
    var scope=getScope(service.value);
    groups.forEach(function(group){group.hidden=group.getAttribute("data-quote-scope")!==scope;});
    status.textContent="";
    if(!result.hidden)render(false);
  }
  function render(focus){
    data=values();
    price.textContent=data.estimate;
    time.textContent=data.period;
    details.textContent=data.text;
    go.href="order.html?service="+encodeURIComponent(data.service)+"&briefNote="+encodeURIComponent(data.note);
    result.hidden=false;
    status.textContent="";
    if(focus){
      result.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"});
      byId("quote-result-title").focus({preventScroll:true});
    }
  }
  action.addEventListener("click",function(){render(true);});
  service.addEventListener("change",showScope);
  [materials,deadline,comment].forEach(function(field){field.addEventListener(field===comment?"input":"change",function(){if(!result.hidden)render(false);});});
  groups.forEach(function(group){group.addEventListener("change",function(){if(!result.hidden)render(false);});});
  function fallbackCopy(text){
    var field=document.createElement("textarea");
    field.value=text;field.setAttribute("readonly","");field.style.position="fixed";field.style.opacity="0";
    document.body.appendChild(field);field.focus();field.select();
    var succeeded=false;try{succeeded=document.execCommand("copy");}catch(e){}
    field.remove();return succeeded;
  }
  copy.addEventListener("click",function(){
    if(!data)return;
    var fallback=function(){status.textContent=fallbackCopy(data.text)?"Расчёт скопирован ✓":"Не удалось скопировать автоматически. Выделите текст расчёта выше.";};
    if(navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext){
      navigator.clipboard.writeText(data.text).then(function(){status.textContent="Расчёт скопирован ✓";},fallback);
    }else fallback();
  });
  download.addEventListener("click",function(){
    if(!data)return;
    var file=new Blob([data.text],{type:"text/plain;charset=utf-8"});
    var url=URL.createObjectURL(file);
    var link=document.createElement("a");link.href=url;link.download="SiteWorksStudio-proekt.txt";
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(function(){URL.revokeObjectURL(url);},1000);
    status.textContent="Файл расчёта подготовлен ✓";
  });
  showScope();
})();