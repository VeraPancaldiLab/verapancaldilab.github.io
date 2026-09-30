// Filter the "All publications" list by free text or by clicking a tag.
(function () {
  var input = document.getElementById("pub-search");
  if (!input) return;
  var rows = document.querySelectorAll(".citation[data-search]");
  var groups = document.querySelectorAll(".year-group");
  var count = document.getElementById("pub-count");
  var empty = document.getElementById("pub-empty");

  function filter() {
    var terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    var shown = 0;
    rows.forEach(function (row) {
      var text = row.getAttribute("data-search");
      var match = terms.every(function (t) { return text.indexOf(t) !== -1; });
      row.hidden = !match;
      if (match) shown++;
    });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector(".citation[data-search]:not([hidden])");
    });
    count.textContent = shown + " of " + rows.length;
    empty.hidden = shown > 0;
  }

  input.addEventListener("input", filter);

  document.addEventListener("click", function (e) {
    var tag = e.target.closest(".tag");
    if (!tag) return;
    input.value = tag.getAttribute("data-tag");
    filter();
    document.getElementById("all").scrollIntoView({ behavior: "smooth" });
  });

  filter();
})();
