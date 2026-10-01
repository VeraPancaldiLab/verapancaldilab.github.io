// Animated header background: a living version of the tysserand spatial network.
// Cells (orange / blue / green, grouped in tissue-like regions) drift gently, the Delaunay
// network linking them moves with them, fluorescence glows shift behind, and light pulses
// travel along the links. Falls back to the static tysserand image when JS is off.
(function () {
  var header = document.querySelector(".site-header");
  if (!header || !window.requestAnimationFrame) return;

  var canvas = document.createElement("canvas");
  canvas.className = "header-canvas";
  canvas.setAttribute("aria-hidden", "true");
  header.insertBefore(canvas, header.firstChild);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var COLORS = ["#ff8c1a", "#3b82d6", "#3fae49"]; // orange, blue, green — as in the tysserand figure
  var GLOWS = ["rgba(40,200,70,", "rgba(40,60,255,", "rgba(255,40,60,"]; // green, blue, red fluorescence
  var EDGE = "rgba(215,220,232,0.62)";
  var SPACING = 46;       // average distance between cells (px)
  var PULSES = 14;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, nodes = [], edges = [], glows = [], pulses = [], running = false, visible = true;

  // Deterministic random so the network looks the same on every page load.
  var seed = 20180;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // Bowyer–Watson Delaunay triangulation; returns the list of unique edges [i, j].
  function delaunayEdges(pts) {
    var n = pts.length, big = 1e5;
    var all = pts.concat([{ x: -big, y: -big }, { x: big, y: -big }, { x: 0, y: big }]);
    function circum(a, b, c) {
      var A = all[a], B = all[b], C = all[c];
      var d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) || 1e-12;
      var a2 = A.x * A.x + A.y * A.y, b2 = B.x * B.x + B.y * B.y, c2 = C.x * C.x + C.y * C.y;
      var ux = (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d;
      var uy = (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d;
      return { a: a, b: b, c: c, x: ux, y: uy, r2: (A.x - ux) * (A.x - ux) + (A.y - uy) * (A.y - uy) };
    }
    var tris = [circum(n, n + 1, n + 2)];
    for (var i = 0; i < n; i++) {
      var p = all[i], keep = [], boundary = {};
      for (var t = 0; t < tris.length; t++) {
        var T = tris[t], dx = p.x - T.x, dy = p.y - T.y;
        if (dx * dx + dy * dy < T.r2) {
          [[T.a, T.b], [T.b, T.c], [T.c, T.a]].forEach(function (e) {
            var k = e[0] < e[1] ? e[0] + "_" + e[1] : e[1] + "_" + e[0];
            if (boundary[k]) delete boundary[k]; else boundary[k] = e;
          });
        } else keep.push(T);
      }
      for (var k in boundary) keep.push(circum(boundary[k][0], boundary[k][1], i));
      tris = keep;
    }
    var seen = {}, out = [];
    tris.forEach(function (T) {
      if (T.a >= n || T.b >= n || T.c >= n) return;
      [[T.a, T.b], [T.b, T.c], [T.c, T.a]].forEach(function (e) {
        var k = e[0] < e[1] ? e[0] + "_" + e[1] : e[1] + "_" + e[0];
        if (!seen[k]) { seen[k] = 1; out.push(e); }
      });
    });
    return out;
  }

  function build() {
    var rect = header.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width)); H = Math.max(1, Math.round(rect.height));
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed = 20180;

    // Tissue regions: each region seed has a cell type; a cell mostly takes the type of its nearest seed.
    var regions = [];
    var nRegions = Math.max(6, Math.round(W / 150));
    for (var r = 0; r < nRegions; r++) {
      regions.push({ x: (r + 0.2 + rand() * 0.6) * W / nRegions, y: rand() * H, type: (r + (rand() < 0.3 ? 1 : 0)) % 3 });
    }

    nodes = [];
    for (var gy = -SPACING; gy <= H + SPACING; gy += SPACING) {
      for (var gx = -SPACING; gx <= W + SPACING; gx += SPACING) {
        var x = gx + (rand() - 0.5) * SPACING * 0.8, y = gy + (rand() - 0.5) * SPACING * 0.8;
        var best = 0, bd = Infinity;
        for (var q = 0; q < regions.length; q++) {
          var d = (regions[q].x - x) * (regions[q].x - x) + (regions[q].y - y) * (regions[q].y - y);
          if (d < bd) { bd = d; best = q; }
        }
        var type = rand() < 0.18 ? Math.floor(rand() * 3) : regions[best].type;
        nodes.push({
          hx: x, hy: y, x: x, y: y, type: type, r: 3.6 + rand() * 1.5,
          ax: SPACING * (0.12 + rand() * 0.12), ay: SPACING * (0.12 + rand() * 0.12),
          wx: 0.25 + rand() * 0.35, wy: 0.25 + rand() * 0.35, px: rand() * 6.283, py: rand() * 6.283
        });
      }
    }
    edges = delaunayEdges(nodes.map(function (n) { return { x: n.hx, y: n.hy }; }));

    glows = [];
    var nGlows = Math.max(4, Math.round(W / 260));
    for (var g = 0; g < nGlows; g++) {
      glows.push({
        x: rand() * W, y: rand() * H, rad: 110 + rand() * 150, c: GLOWS[g % 3 === 2 ? 2 : g % 2],
        a: 0.26 + rand() * 0.16, w: 0.05 + rand() * 0.08, p: rand() * 6.283, dx: 40 + rand() * 60, dy: 15 + rand() * 25
      });
    }

    pulses = [];
    for (var s = 0; s < PULSES; s++) pulses.push(newPulse(rand()));
  }

  function newPulse(t0) {
    var e = edges[Math.floor(Math.random() * edges.length)] || [0, 0];
    var flip = Math.random() < 0.5;
    return { a: flip ? e[1] : e[0], b: flip ? e[0] : e[1], t: t0 || 0, v: 0.35 + Math.random() * 0.5 };
  }

  var last = 0;
  function draw(ms) {
    var time = ms / 1000, dt = Math.min(0.05, last ? time - last : 0.016); last = time;

    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);

    // Fluorescence glows
    ctx.globalCompositeOperation = "lighter";
    for (var g = 0; g < glows.length; g++) {
      var G = glows[g];
      var gx = G.x + Math.sin(time * G.w + G.p) * G.dx, gy = G.y + Math.cos(time * G.w * 0.8 + G.p) * G.dy;
      var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, G.rad);
      grad.addColorStop(0, G.c + G.a + ")"); grad.addColorStop(1, G.c + "0)");
      ctx.fillStyle = grad;
      ctx.fillRect(gx - G.rad, gy - G.rad, G.rad * 2, G.rad * 2);
    }
    ctx.globalCompositeOperation = "source-over";

    // Cells drift around their home position
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x = n.hx + Math.sin(time * n.wx + n.px) * n.ax;
      n.y = n.hy + Math.cos(time * n.wy + n.py) * n.ay;
    }

    // Network links
    ctx.strokeStyle = EDGE; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (var e = 0; e < edges.length; e++) {
      var A = nodes[edges[e][0]], B = nodes[edges[e][1]];
      ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
    }
    ctx.stroke();

    // Signals travelling along links
    for (var s = 0; s < pulses.length; s++) {
      var P = pulses[s];
      P.t += P.v * dt;
      if (P.t >= 1) { pulses[s] = newPulse(0); continue; }
      var a = nodes[P.a], b = nodes[P.b];
      var x = a.x + (b.x - a.x) * P.t, y = a.y + (b.y - a.y) * P.t;
      var fade = Math.sin(P.t * Math.PI);
      ctx.fillStyle = "rgba(255,255,255," + (0.25 * fade) + ")";
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255," + (0.95 * fade) + ")";
      ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 6.283); ctx.fill();
    }

    // Cells, one colour at a time
    for (var c = 0; c < 3; c++) {
      ctx.fillStyle = COLORS[c];
      ctx.beginPath();
      for (var k = 0; k < nodes.length; k++) {
        var m = nodes[k];
        if (m.type !== c) continue;
        ctx.moveTo(m.x + m.r, m.y); ctx.arc(m.x, m.y, m.r, 0, 6.283);
      }
      ctx.fill();
    }
  }

  function loop(ms) {
    if (!running) return;
    draw(ms);
    requestAnimationFrame(loop);
  }
  function update() {
    var should = visible && !document.hidden && !reduceMotion;
    if (should && !running) { running = true; last = 0; requestAnimationFrame(loop); }
    else if (!should) running = false;
  }

  build();
  draw(0);
  header.classList.add("has-canvas");

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { build(); draw(performance.now()); }, 150);
  });
  document.addEventListener("visibilitychange", update);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; update(); }).observe(header);
  }
  update();
})();
