// English pages only: a first visit goes to the visitor's own language, if MimoDays speaks it.
// A language picked in the footer menu sticks, English included.
(() => {
  // Search crawlers stay where they are: hreflang already tells them about every language,
  // and a redirect would hide this page from one that renders in another language.
  if (/googlebot|google-inspectiontool|bingbot|yandex\w*bot|duckduckbot|applebot|baiduspider|petalbot|seznambot|chrome-lighthouse/i.test(navigator.userAgent)) return;
  const paths = ["de", "fr", "es", "it", "nl", "sv", "pl", "pt-br", "ru", "uk", "be", "hy", "ka", "kk", "tr", "he", "ar", "ja", "ko", "zh-hans", "zh-hant"];
  const go = path => location.replace(`/${path}${location.pathname}${location.search}${location.hash}`);
  let picked = null;
  try { picked = localStorage.getItem("mimodays.lang"); } catch (e) { /* storage blocked: decide by the browser */ }
  if (picked) {
    if (paths.includes(picked)) go(picked);
    return;
  }
  const match = tag => {
    const t = tag.toLowerCase();
    if (t.startsWith("zh")) return /hant|-tw|-hk|-mo/.test(t) ? "zh-hant" : "zh-hans";
    if (t.startsWith("pt")) return "pt-br";
    const base = t.split("-")[0];
    return base === "en" || paths.includes(base) ? base : null;
  };
  for (const tag of navigator.languages || [navigator.language || "en"]) {
    const path = match(tag);
    if (path) {
      if (path !== "en") go(path);
      return;
    }
  }
})();
