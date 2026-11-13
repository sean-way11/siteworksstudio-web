/* Category filtering for the SiteWorksStudio concept portfolio. */
(function () {
  "use strict";
  var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".project-card[data-category]"));
  var count = document.getElementById("portfolio-count");
  if (!buttons.length || !cards.length) return;

  function applyFilter(filter) {
    var visible = 0;
    cards.forEach(function (card) {
      var show = filter === "all" || card.getAttribute("data-category") === filter;
      card.hidden = !show;
      if (show) visible += 1;
    });
    buttons.forEach(function (button) {
      var active = button.getAttribute("data-filter") === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    var lastTwo = visible % 100;
    var lastOne = visible % 10;
    var noun = (lastTwo >= 11 && lastTwo <= 14) ? "работ" : (lastOne === 1 ? "работа" : (lastOne >= 2 && lastOne <= 4 ? "работы" : "работ"));
    if (count) count.textContent = "Показано " + visible + " " + noun;
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () { applyFilter(button.getAttribute("data-filter")); });
  });
}());
