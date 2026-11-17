(function () {
  "use strict";
  var form = document.getElementById("booking-demo");
  var dateInput = document.getElementById("booking-date");
  var result = document.getElementById("booking-result");

  function updateDateLimit() {
    var today = new Date();
    dateInput.min = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");
  }

  updateDateLimit();
  dateInput.addEventListener("focus", updateDateLimit);
  form.addEventListener("input", function () {
    result.textContent = "";
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    updateDateLimit();
    if (!form.reportValidity()) return;

    var values = new FormData(form);
    var date = new Date(values.get("date") + "T12:00:00");
    var dateLabel = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" }).format(date);
    result.textContent = "Демозапись подтверждена: " + values.get("service") + ", " + dateLabel + ", " + values.get("time") + ".";
  });
})();
