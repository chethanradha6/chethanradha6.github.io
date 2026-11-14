(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // ---------- Year ----------
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  // ---------- Theme toggle ----------
  var themeBtn = $("#theme-toggle");
  function syncThemeLabel() {
    var dark = root.getAttribute("data-theme") !== "light";
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }
  if (themeBtn) {
    syncThemeLabel();
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncThemeLabel();
    });
  }

  // ---------- Mobile menu ----------
  var toggle = $(".nav-toggle"), links = $("#nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  // ---------- Scroll progress ----------
  var bar = $("#progress-bar");
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // ---------- Active nav link ----------
  var navAs = $$(".nav-links a");
  if ("IntersectionObserver" in window) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navAs.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + en.target.id ? "true" : "false"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navAs.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) navObs.observe(s); });
  }

  // ---------- Reveal + counters ----------
  function countUp(el) {
    var to = parseFloat(el.getAttribute("data-to")), dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    if (reduceMotion) { el.textContent = to.toFixed(dec); return; }
    var start = performance.now(), dur = 1400;
    (function step(now) {
      var p = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        $$(".count", en.target).forEach(countUp);
        revObs.unobserve(en.target);
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { revObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // ---------- Skills show more ----------
  var moreBtn = $("#skills-more"), grid = $("#skill-grid");
  if (moreBtn && grid) {
    moreBtn.addEventListener("click", function () {
      var open = grid.classList.toggle("expanded");
      moreBtn.setAttribute("aria-expanded", String(open));
      moreBtn.innerHTML = open ? 'Show Less <span aria-hidden="true">▴</span>' : 'Show More <span aria-hidden="true">▾</span>';
    });
  }

  // ---------- Matrix rain ----------
  var canvas = $("#matrix");
  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var glyphs = "01アイウエオカキクケコサシスセソ<>/{}[]$#=+*:;ABCDEF0123456789".split("");
    var size = 15, cols = 0, drops = [], last = 0, running = true;
    function resize() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(r.width / size);
      drops = Array.from({ length: cols }, function () { return Math.random() * -60; });
    }
    function color(a) { return "rgba(" + getComputedStyle(root).getPropertyValue("--matrix").trim() + "," + a + ")"; }
    function draw(t) {
      if (!running) return;
      requestAnimationFrame(draw);
      if (t - last < 55) return; last = t;
      var w = canvas.width, h = canvas.height;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.font = size + "px JetBrains Mono, monospace";
      var c1 = color(0.9), c2 = color(0.45);
      for (var i = 0; i < cols; i++) {
        if (i % 2 && Math.random() > 0.6) continue;
        var ch = glyphs[(Math.random() * glyphs.length) | 0];
        ctx.fillStyle = Math.random() > 0.96 ? c1 : c2;
        ctx.fillText(ch, i * size, drops[i] * size);
        if (drops[i] * size > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
    }
    resize(); window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(draw); }
        else if (!vis) running = false;
      }).observe(canvas);
    }
    requestAnimationFrame(draw);
  }

  // ---------- Hero terminal typing ----------
  async function typeText(el, text, speed) {
    if (reduceMotion) { el.textContent = text; return; }
    el.textContent = "";
    for (var i = 0; i < text.length; i++) { el.textContent += text[i]; await sleep(speed + Math.random() * speed); }
  }
  (async function () {
    var cmd = $("#hero-cmd"), out = $("#hero-out");
    if (!cmd || !out) return;
    await sleep(reduceMotion ? 0 : 500);
    await typeText(cmd, cmd.getAttribute("data-text"), 70);
    await sleep(reduceMotion ? 0 : 300);
    await typeText(out, out.getAttribute("data-text"), 28);
  })();

  // ---------- Code editor ----------
  var FILES = {
    cdk: { lang: "Python", style: "py", code: [
      "from aws_cdk import Stack, Duration",
      "from aws_cdk import aws_ec2 as ec2, aws_ecs as ecs",
      "from constructs import Construct",
      "",
      "",
      "class SiteInfraStack(Stack):",
      "    \"\"\"Self-provisioning infrastructure for one site.\"\"\"",
      "",
      "    def __init__(self, scope: Construct, id: str, **kwargs) -> None:",
      "        super().__init__(scope, id, **kwargs)",
      "",
      "        vpc = ec2.Vpc(self, \"SiteVpc\", max_azs=2, nat_gateways=1)",
      "        cluster = ecs.Cluster(self, \"SiteCluster\", vpc=vpc,",
      "                              container_insights=True)",
      "",
      "        # one container stack per site, same build everywhere",
      "        self.service = self.collector_service(cluster, replicas=2)",
      "        self.alarms = self.health_alarms(self.service, period=Duration.minutes(1))"
    ]},
    docker: { lang: "YAML", style: "yaml", code: [
      "services:",
      "  api:",
      "    build: ./api",
      "    ports: [\"8080:8080\"]",
      "    environment:",
      "      - LOG_LEVEL=info",
      "    healthcheck:",
      "      test: [\"CMD\", \"curl\", \"-f\", \"http://localhost:8080/health\"]",
      "      interval: 30s",
      "      retries: 3",
      "    restart: unless-stopped",
      "",
      "  prometheus:",
      "    image: prom/prometheus:latest",
      "    volumes:",
      "      - ./prometheus.yml:/etc/prometheus/prometheus.yml",
      "",
      "  grafana:",
      "    image: grafana/grafana:latest",
      "    ports: [\"3000:3000\"]",
      "    depends_on: [prometheus]"
    ]},
    ci: { lang: "YAML", style: "yaml", code: [
      "stages: [test, build, deploy]",
      "",
      "variables:",
      "  IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA",
      "",
      "test:",
      "  stage: test",
      "  image: python:3.12",
      "  script:",
      "    - pip install -r requirements.txt",
      "    - pytest --cov=app tests/",
      "",
      "build:",
      "  stage: build",
      "  image: docker:27",
      "  services: [docker:27-dind]",
      "  script:",
      "    - docker build -t $IMAGE .",
      "    - docker push $IMAGE",
      "",
      "deploy:",
      "  stage: deploy",
      "  script:",
      "    - ansible-playbook -i inventory/sites deploy.yml -e image=$IMAGE",
      "  rules:",
      "    - if: $CI_COMMIT_BRANCH == \"main\""
    ]},
    nginx: { lang: "Nginx", style: "conf", code: [
      "upstream flask_app {",
      "    least_conn;",
      "    server 10.0.1.10:5000 max_fails=3 fail_timeout=10s;",
      "    server 10.0.1.11:5000 max_fails=3 fail_timeout=10s;",
      "}",
      "",
      "server {",
      "    listen 443 ssl;",
      "    server_name api.internal.example;",
      "",
      "    ssl_certificate     /etc/nginx/tls/server.crt;",
      "    ssl_certificate_key /etc/nginx/tls/server.key;",
      "",
      "    location / {",
      "        proxy_pass http://flask_app;",
      "        proxy_set_header Host $host;",
      "        proxy_set_header X-Real-IP $remote_addr;",
      "        proxy_read_timeout 30s;",
      "    }",
      "}"
    ]}
  };

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  var KW = {
    py: /\b(from|import|as|class|def|return|self|None|True|False|super|if|else|for|in)\b/g,
    conf: /\b(upstream|server|listen|location|proxy_pass|proxy_set_header|proxy_read_timeout|least_conn|server_name|ssl_certificate_key|ssl_certificate|ssl)\b/g
  };
  function highlight(line, style) {
    // comments
    var cIdx = -1;
    if (style === "py" || style === "yaml" || style === "conf") {
      var m = line.match(/(^|\s)#.*/); if (m) cIdx = m.index + m[1].length;
    }
    var code = cIdx >= 0 ? line.slice(0, cIdx) : line;
    var comment = cIdx >= 0 ? line.slice(cIdx) : "";
    var out = "", re = /("[^"]*"|'[^']*')/g, last = 0, mm;
    function plain(s) {
      s = esc(s);
      if (style === "yaml") {
        s = s.replace(/^(\s*-?\s*)([\w.$-]+)(:)(?=\s|$)/, '$1<span class="tk-key">$2</span>$3');
        s = s.replace(/(\$[A-Z_]+)/g, '<span class="tk-f">$1</span>');
      } else {
        if (KW[style]) s = s.replace(KW[style], '<span class="tk-k">$1</span>');
        if (style === "py") s = s.replace(/\b([A-Za-z_]\w*)(?=\()/g, '<span class="tk-f">$1</span>');
        if (style === "conf") s = s.replace(/(\$[a-z_]+)/g, '<span class="tk-f">$1</span>');
      }
      return s.replace(/(^|[^\w#">-])(\d+(?:\.\d+)*[a-z]*)\b/g, '$1<span class="tk-n">$2</span>');
    }
    while ((mm = re.exec(code))) {
      out += plain(code.slice(last, mm.index)) + '<span class="tk-s">' + esc(mm[0]) + "</span>";
      last = mm.index + mm[0].length;
    }
    out += plain(code.slice(last));
    if (comment) out += '<span class="tk-c">' + esc(comment) + "</span>";
    return out;
  }

  var view = $("#code-view"), langEl = $("#code-lang"), posEl = $("#code-pos");
  var tabs = $$(".tab"), order = ["cdk", "docker", "ci", "nginx"];
  var runId = 0, userPicked = false, started = false;

  function selectTab(key) {
    tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.getAttribute("data-file") === key)); });
  }
  function renderFull(key) {
    var f = FILES[key];
    view.innerHTML = f.code.map(function (l) { return '<span class="ln">' + (highlight(l, f.style) || " ") + "</span>"; }).join("");
    if (langEl) langEl.textContent = f.lang;
    if (posEl) posEl.textContent = "Ln " + f.code.length + ", Col " + (f.code[f.code.length - 1].length + 1);
  }
  async function typeFile(key, id) {
    var f = FILES[key];
    selectTab(key);
    if (langEl) langEl.textContent = f.lang;
    if (reduceMotion) { renderFull(key); return; }
    view.innerHTML = "";
    for (var i = 0; i < f.code.length; i++) {
      if (id !== runId) return;
      var line = document.createElement("span");
      line.className = "ln cur"; view.appendChild(line);
      var text = f.code[i];
      for (var j = 0; j < text.length; j++) {
        if (id !== runId) return;
        if (text[j] === " " && text.slice(0, j).trim() === "") { continue; }
        line.textContent = text.slice(0, j + 1);
        if (posEl) posEl.textContent = "Ln " + (i + 1) + ", Col " + (j + 2);
        await sleep(14 + Math.random() * 22);
      }
      line.className = "ln";
      line.innerHTML = highlight(text, f.style) || " ";
      view.parentNode.scrollTop = view.parentNode.scrollHeight;
      await sleep(text ? 60 : 30);
    }
    var lastLine = view.lastChild; if (lastLine) lastLine.classList.add("cur");
  }
  async function loop(startKey) {
    var id = ++runId, idx = order.indexOf(startKey);
    while (id === runId) {
      await typeFile(order[idx], id);
      if (id !== runId || userPicked || reduceMotion) return;
      await sleep(3500);
      idx = (idx + 1) % order.length;
    }
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      userPicked = true; started = true;
      var key = t.getAttribute("data-file");
      if (reduceMotion) { selectTab(key); renderFull(key); } else { loop(key); }
    });
    t.addEventListener("keydown", function (e) {
      var i = tabs.indexOf(t);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        var n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        n.focus(); n.click();
      }
    });
  });
  if (view) {
    renderFull("cdk");
    if (!reduceMotion && "IntersectionObserver" in window) {
      var edObs = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !started) { started = true; loop("cdk"); edObs.disconnect(); }
      }, { threshold: 0.3 });
      edObs.observe(view);
    }
  }
})();
