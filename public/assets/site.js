// MimoDays website: hand-cut outlines, the menu, and the phone that follows the story.

(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  // Hand-cut outlines, the same seeded wobble as the app's cards.
  const wobble = (w, h, seed, amp, r) => {
    let s = seed * 9301 + 49297;
    const j = () => { s = (s * 9301 + 49297) % 233280; return (s / 233280 - 0.5) * 2 * amp; };
    const p = [[r + j(), j()], [w - r + j(), j()], [w + j(), r + j()], [w + j(), h - r + j()],
      [w - r + j(), h + j()], [r + j(), h + j()], [j(), h - r + j()], [j(), r + j()]];
    const f = n => n.toFixed(1);
    return `M${f(p[0][0])},${f(p[0][1])}`
      + ` C${f(w * .4)},${f(j())} ${f(w * .6)},${f(j())} ${f(p[1][0])},${f(p[1][1])}`
      + ` Q${f(w + j() / 2)},${f(j() / 2)} ${f(p[2][0])},${f(p[2][1])}`
      + ` C${f(w + j())},${f(h * .4)} ${f(w + j())},${f(h * .6)} ${f(p[3][0])},${f(p[3][1])}`
      + ` Q${f(w + j() / 2)},${f(h + j() / 2)} ${f(p[4][0])},${f(p[4][1])}`
      + ` C${f(w * .6)},${f(h + j())} ${f(w * .4)},${f(h + j())} ${f(p[5][0])},${f(p[5][1])}`
      + ` Q${f(j() / 2)},${f(h + j() / 2)} ${f(p[6][0])},${f(p[6][1])}`
      + ` C${f(j())},${f(h * .6)} ${f(j())},${f(h * .4)} ${f(p[7][0])},${f(p[7][1])}`
      + ` Q${f(j() / 2)},${f(j() / 2)} ${f(p[0][0])},${f(p[0][1])} Z`;
  };

  const SVG = "http://www.w3.org/2000/svg";
  const draw = el => {
    // The shape fills the padding box: its own size, before any rotation and inside the fallback border.
    const cw = el.clientWidth, ch = el.clientHeight;
    if (!cw || !ch) return;
    let svg = el.querySelector(":scope > svg.cut__shape");
    if (!svg) {
      svg = document.createElementNS(SVG, "svg");
      svg.setAttribute("class", "cut__shape");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.appendChild(document.createElementNS(SVG, "path"));
      el.prepend(svg);
    }
    const style = getComputedStyle(el);
    const amp = +(el.dataset.amp || 3), r = +(el.dataset.radius || 22);
    svg.setAttribute("viewBox", `0 0 ${cw} ${ch}`);
    const path = svg.firstChild;
    path.setAttribute("d", wobble(cw, ch, +(el.dataset.seed || 1), amp, Math.min(r, ch / 2.5)));
    path.setAttribute("fill", style.getPropertyValue("--cut-fill").trim() || "#FBF6EF");
    path.setAttribute("stroke", style.getPropertyValue("--cut-stroke").trim() || "#4A2734");
    path.setAttribute("stroke-width", "1.25");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    el.classList.add("is-drawn");
  };
  const cuts = document.querySelectorAll(".cut");
  cuts.forEach((el, i) => { if (!el.dataset.seed) el.dataset.seed = String(11 + i * 7); });
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(entries => entries.forEach(e => draw(e.target)));
    cuts.forEach(el => ro.observe(el));
  } else {
    cuts.forEach(draw);
  }

  // The header bar on one line in every language: the badge goes first, then the menu folds behind its button.
  const header = document.querySelector(".site-header");
  const bar = header && header.querySelector(".wrap");
  if (bar) {
    const overflows = () => bar.scrollWidth > bar.clientWidth + 1;
    const fit = () => {
      header.classList.remove("is-tight", "is-folded");
      if (overflows()) header.classList.add("is-tight");
      if (overflows()) header.classList.add("is-folded");
    };
    fit();
    addEventListener("resize", fit);
    if (document.fonts) document.fonts.ready.then(fit);
  }

  // The header's language panel closes on a click elsewhere or Escape.
  const switcher = document.querySelector(".lang-switch");
  if (switcher) {
    document.addEventListener("click", e => { if (switcher.open && !switcher.contains(e.target)) switcher.open = false; });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && switcher.open) { switcher.open = false; switcher.querySelector("summary").focus(); }
    });
  }

  // A language picked in the header or the footer sticks (lang.js reads it on the English pages).
  document.querySelectorAll(".languages a[data-lang], .lang-switch a[data-lang]").forEach(link => link.addEventListener("click", () => {
    try { localStorage.setItem("mimodays.lang", link.dataset.lang); } catch (e) { /* storage blocked: the link still works */ }
  }));

  // Menu on narrow screens.
  const button = document.querySelector(".menu-button");
  const nav = document.getElementById("site-nav");
  if (button && nav) {
    const set = open => { nav.classList.toggle("is-open", open); button.setAttribute("aria-expanded", String(open)); };
    button.addEventListener("click", () => set(!nav.classList.contains("is-open")));
    nav.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
  }

  // The phone that stays put: shows the screen of the chapter crossing the middle of the window.
  const rail = document.querySelector(".rail");
  const layers = rail ? [...rail.querySelectorAll("[data-screen]")] : [];
  const chapters = [...document.querySelectorAll(".chapter[data-screen]")];
  const play = media => {
    if (!(media instanceof HTMLVideoElement)) return;
    if (reduceMotion.matches) { media.pause(); return; }
    if (media.preload === "none") media.preload = "auto";
    media.play().catch(() => {});
  };
  const pause = media => { if (media instanceof HTMLVideoElement) media.pause(); };
  const show = name => layers.forEach(l => {
    const on = l.dataset.screen === name;
    l.classList.toggle("is-on", on);
    on ? play(l) : pause(l);
  });
  if (layers.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) show(e.target.dataset.screen); });
    }, { rootMargin: "-50% 0px -50% 0px" });
    chapters.forEach(c => io.observe(c));
  }

  // Phones inside the chapters (narrow screens): play only while on screen.
  const inline = document.querySelectorAll(".phone--inline video");
  if (inline.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting ? play(e.target) : pause(e.target)), { threshold: .4 });
    inline.forEach(v => io.observe(v));
  }
})();
