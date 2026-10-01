// Filter the tools list by programming language.
(function () {
  var buttons = document.querySelectorAll(".filter-btn");
  var tools = document.querySelectorAll(".tool");
  if (!buttons.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      buttons.forEach(function (b) { b.classList.toggle("active", b === btn); });
      tools.forEach(function (tool) {
        tool.hidden = filter !== "all" && tool.getAttribute("data-language") !== filter;
      });
    });
  });
})();
