// Research page: search/filter the "All publications" list, topic chips, and expandable author lists.
(function () {
  // Expand / collapse long author lists (works for every citation on the site).
  document.addEventListener("click", function (e) {
    var toggle = e.target.closest(".authors-toggle");
    if (!toggle) return;
    var box = toggle.parentNode;
    var open = toggle.getAttribute("aria-expanded") === "true";
    box.querySelector(".authors-more").hidden = open;
    box.querySelector(".authors-ellipsis").hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "false" : "true");
    toggle.textContent = open ? toggle.getAttribute("data-more") : "show fewer";
  });

  var input = document.getElementById("pub-search");
  if (!input) return;
  var list = document.getElementById("all");
  var rows = document.querySelectorAll(".citation[data-search]");
  var groups = document.querySelectorAll(".year-group");
  var chips = document.querySelectorAll(".pub-filters .tag");
  var count = document.getElementById("pub-count");
  var clear = document.getElementById("pub-clear");
  var empty = document.getElementById("pub-empty");

  function filter() {
    var query = input.value.toLowerCase().trim();
    var terms = query.split(/\s+/).filter(Boolean);
    var shown = 0;
    rows.forEach(function (row) {
      var text = row.getAttribute("data-search");
      var match = terms.every(function (t) { return text.indexOf(t) !== -1; });
      row.hidden = !match;
      if (match) shown++;
    });
    groups.forEach(function (g) {
      var n = g.querySelectorAll(".citation[data-search]:not([hidden])").length;
      g.hidden = n === 0;
      var label = g.querySelector(".year-count");
      if (label) label.textContent = n + (n === 1 ? " publication" : " publications");
    });
    chips.forEach(function (c) {
      c.classList.toggle("active", c.getAttribute("data-tag").toLowerCase() === query);
    });
    count.textContent = shown + " of " + rows.length;
    clear.hidden = !query;
    empty.hidden = shown > 0;
  }

  input.addEventListener("input", filter);
  clear.addEventListener("click", function () { input.value = ""; filter(); input.focus(); });

  // Clicking a topic (in the toolbar or on any paper) filters the list; clicking the active one clears it.
  document.addEventListener("click", function (e) {
    var tag = e.target.closest(".tag");
    if (!tag) return;
    var value = tag.getAttribute("data-tag");
    input.value = tag.classList.contains("active") ? "" : value;
    filter();
    if (!tag.closest(".pub-toolbar")) list.scrollIntoView({ behavior: "smooth" });
  });

  filter();
})();
