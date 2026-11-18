#!/usr/bin/env python3
"""The site in every language MimoDays speaks. The English pages in public/ are the source.

  tools/i18n.py extract        -> i18n/source.json: every text on the English pages, with where it appears
  tools/i18n.py check <lang>   -> i18n/<lang>.json has every text, with the same markup inside
  tools/i18n.py build          -> public/<lang>/... for every complete language, plus the language links,
                                  hreflang alternates and sitemap on every page, English included

A text is the inner HTML of an element that holds words (a heading, a paragraph, a link…), or a text attribute
(alt, aria-label, a description). Its translation keeps the same tags and links; only words change.
"""
import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
I18N = ROOT / "i18n"
SITE = "https://mimodays.mrmaier.com"
PAGES = ["index.html", "support/index.html", "privacy-policy/index.html", "terms/index.html", "404.html"]

# (path, hreflang, native name, right to left), in the app's order.
LANGS = [
    ("en", "en", "English", False), ("de", "de", "Deutsch", False), ("fr", "fr", "Français", False),
    ("es", "es", "Español", False), ("it", "it", "Italiano", False), ("nl", "nl", "Nederlands", False),
    ("sv", "sv", "Svenska", False), ("pl", "pl", "Polski", False), ("pt-br", "pt-BR", "Português (Brasil)", False),
    ("ru", "ru", "Русский", False), ("uk", "uk", "Українська", False), ("be", "be", "Беларуская", False),
    ("hy", "hy", "Հայերեն", False), ("ka", "ka", "ქართული", False), ("kk", "kk", "Қазақ тілі", False),
    ("tr", "tr", "Türkçe", False), ("he", "he", "עברית", True), ("ar", "ar", "العربية", True),
    ("ja", "ja", "日本語", False), ("ko", "ko", "한국어", False), ("zh-hans", "zh-Hans", "简体中文", False),
    ("zh-hant", "zh-Hant", "繁體中文", False),
]
APP_CODE = {"pt-br": "pt-BR", "zh-hans": "zh-Hans", "zh-hant": "zh-Hant"}  # store/l10n file names

UNIT_TAGS = {"title", "h1", "h2", "h3", "p", "summary", "li", "a", "span", "small", "figcaption", "button"}
CONTAINERS = {"div", "ul", "ol", "section", "figure", "details", "nav", "header", "footer", "main", "article", "svg", "video"}
TEXT_ATTRS = {"alt", "aria-label"}
META_TEXT = {"description", "og:title", "og:description", "og:image:alt"}
KEEP = {"MimoDays", "MIMODAYS"}
# Texts the build adds itself, not found on the English pages.
EXTRA = {
    "Language": "Footer: label of the language menu",
    "This translation is provided for convenience. If it differs from the English version, the English version applies.":
        "Legal pages (privacy policy, terms), translated versions only: a note under the title",
}
BLOCK = re.compile(r"\n?[ \t]*<!-- i18n:(\w+) -->.*?<!-- /i18n:\1 -->", re.S)


def words(fragment):
    text = html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()
    return text if re.search(r"[^\W\d_]", text) and text not in KEEP else None


class Units(HTMLParser):
    """Finds the texts of one page: (start, end) spans of inner HTML, and attribute values by tag span."""

    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source, self.lines = source, [0]
        for line in source.splitlines(keepends=True):
            self.lines.append(self.lines[-1] + len(line))
        self.stack, self.units, self.attrs = [], [], []

    def here(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self.here()
        end = start + len(self.get_starttag_text())
        values = dict(attrs)
        texts = [(k, v) for k, v in attrs if k in TEXT_ATTRS and v and words(v)]
        if tag == "meta" and (values.get("name") in META_TEXT or values.get("property") in META_TEXT) and values.get("content"):
            texts.append(("content", values["content"]))
        if texts:
            self.attrs.append((start, end, texts))
        if tag in {"img", "meta", "link", "br", "source", "input"}:
            return
        self.stack.append([tag, end, False])
        if tag in CONTAINERS:
            for item in self.stack[:-1]:
                item[2] = True  # holds a container: not a unit itself

    def handle_endtag(self, tag):
        while self.stack:
            name, inner, has_container = self.stack.pop()
            if name == tag:
                break
        else:
            return
        if name not in UNIT_TAGS or has_container:
            return
        start, end = inner, self.here()
        if not words(self.source[start:end]):
            return
        # Only the outermost unit counts: drop units inside this one.
        self.units = [u for u in self.units if not (start <= u[0] and u[1] <= end)]
        self.units.append((start, end))

    def handle_data(self, data):
        pass


def scan(page):
    source = BLOCK.sub("", (PUBLIC / page).read_text())
    parser = Units(source)
    parser.feed(source)
    return source, sorted(parser.units), parser.attrs


def key(fragment):
    return re.sub(r"\s+", " ", fragment).strip()


def ld_description(source):
    m = re.search(r'"description": "([^"]*)"', source)
    return m.group(1) if m else None


def extract():
    found = {}
    for page in PAGES:
        source, units, attrs = scan(page)
        for start, end in units:
            found.setdefault(key(source[start:end]), page)
        for _, _, texts in attrs:
            for _, value in texts:
                found.setdefault(html.unescape(value), page)
    I18N.mkdir(exist_ok=True)
    source = {text: {"page": page} for text, page in found.items()}
    for text, note in EXTRA.items():
        source[text] = {"page": "(added by the build)", "note": note}
    (I18N / "source.json").write_text(json.dumps(source, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(source)} texts -> {I18N / 'source.json'}")


class Tags(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, tuple(sorted((k, v) for k, v in attrs if k not in TEXT_ATTRS))))

    def handle_endtag(self, tag):
        self.tags.append(("/" + tag, ()))


def tags(fragment):
    parser = Tags()
    parser.feed(fragment)
    return parser.tags


def check(lang):
    source = json.loads((I18N / "source.json").read_text())
    path = I18N / f"{lang}.json"
    if not path.exists():
        return [f"{path} missing"]
    table = json.loads(path.read_text())
    errors = [f"missing: {t[:70]}" for t in source if not (table.get(t) or "").strip()]
    errors += [f"not in the source: {t[:70]}" for t in table if t not in source]
    for text, translated in table.items():
        if text in source and translated and tags(text) != tags(translated):
            errors.append(f"markup differs: {text[:70]}")
    return errors


# Open Graph wants language_TERRITORY, in the forms Facebook knows (Arabic is ar_AR there).
OG_LOCALE = {
    "en": "en_US", "de": "de_DE", "fr": "fr_FR", "es": "es_ES", "it": "it_IT", "nl": "nl_NL", "sv": "sv_SE",
    "pl": "pl_PL", "pt-br": "pt_BR", "ru": "ru_RU", "uk": "uk_UA", "be": "be_BY", "hy": "hy_AM", "ka": "ka_GE",
    "kk": "kk_KZ", "tr": "tr_TR", "he": "he_IL", "ar": "ar_AR", "ja": "ja_JP", "ko": "ko_KR", "zh-hans": "zh_CN",
    "zh-hant": "zh_TW",
}


def localized_href(href, path):
    if not href.startswith("/") or href.startswith(("/assets/", "/apple-touch-icon")):
        return href
    return f"/{path}{href}"


def page_url(path, page):
    route = "" if page == "index.html" else page.removesuffix("index.html")
    return f"{SITE}/{path + '/' if path != 'en' else ''}{route}"


def language_menu(current, page, label):
    links = []
    for path, hreflang, name, _ in LANGS:
        # A missing page has no counterpart: its menu leads to each language's home page.
        target = page_url(path, "index.html" if page == "404.html" else page).removeprefix(SITE)
        mark = ' aria-current="true"' if path == current else ""
        links.append(f'<li><a href="{target}" hreflang="{hreflang}" lang="{hreflang}" data-lang="{path}"{mark}>{name}</a></li>')
    name = next(n for p, _, n, _ in LANGS if p == current)
    return ("<!-- i18n:languages -->\n"
            f'      <details class="languages"><summary aria-label="{html.escape(label)}: {name}">{name}</summary>'
            f'<ul>{"".join(links)}</ul></details>\n'
            "      <!-- /i18n:languages -->")


# What the header's language button shows: a short code, or the script's own short name where codes collide.
SHORT = {"pt-br": "PT", "zh-hans": "简体", "zh-hant": "繁體"}
GLOBE = ('<svg class="lang-switch__globe" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" '
         'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.6"/>'
         '<path d="M3.6 12h16.8M12 3.4c2.4 2.5 3.6 5.4 3.6 8.6s-1.2 6.1-3.6 8.6c-2.4-2.5-3.6-5.4-3.6-8.6s1.2-6.1 3.6-8.6z"/></g></svg>')


def language_switch(current, page, label):
    """The header's language button and its panel: every language by its own name, the current one marked."""
    links = []
    for path, hreflang, name, _ in LANGS:
        target = page_url(path, "index.html" if page == "404.html" else page).removeprefix(SITE)
        mark = ' aria-current="true"' if path == current else ""
        links.append(f'<li><a href="{target}" hreflang="{hreflang}" lang="{hreflang}" data-lang="{path}"{mark}>{name}</a></li>')
    name = next(n for p, _, n, _ in LANGS if p == current)
    short = SHORT.get(current, current.upper())
    return ("<!-- i18n:switch -->\n"
            # The name starts with the code people see (WCAG label in name), then says it in words.
            f'      <details class="lang-switch"><summary>{GLOBE}'
            f'<span class="lang-switch__code">{short}</span><span class="visually-hidden"> {html.escape(label)}: {name}</span></summary>'
            f'<div class="lang-switch__panel cut" data-seed="5" data-radius="20"><ul>{"".join(links)}</ul></div></details>\n'
            "      <!-- /i18n:switch -->")


def alternates(page, english):
    lines = [f'<link rel="alternate" hreflang="{h}" href="{page_url(p, page)}">' for p, h, _, _ in LANGS]
    lines.append(f'<link rel="alternate" hreflang="x-default" href="{page_url("en", page)}">')
    if english:
        # English pages send a first-time visitor to their own language; a pick in the menu sticks.
        lines.append('<script src="/assets/lang.js"></script>')
    return "<!-- i18n:alternates -->\n  " + "\n  ".join(lines) + "\n  <!-- /i18n:alternates -->"


def decorate(text, path, page, label):
    """The language menu (footer) and alternates (head) for one page, replacing earlier ones."""
    text = BLOCK.sub("", text)
    if page != "404.html":
        text = text.replace("</head>", "  " + alternates(page, path == "en") + "\n</head>", 1)
    text = text.replace('<span class="soon">', language_switch(path, page, label) + '\n      <span class="soon">', 1)
    menu = language_menu(path, page, label)
    text = re.sub(r'(\n\s*<p class="legal-line">)', "\n      " + menu + r"\1", text, count=1)
    return text


def translate(page, path, hreflang, rtl, table):
    source, units, attrs = scan(page)
    edits = [(s, e, table[key(source[s:e])]) for s, e in units]
    for start, end, texts in attrs:
        tag = source[start:end]
        for name, value in texts:
            new = html.escape(table[html.unescape(value)], quote=True)
            tag = tag.replace(f'{name}="{value}"', f'{name}="{new}"', 1)
        # Links get their language below, once (doing it here too sent the logo to /ar/ar/).
        if not tag.startswith("<a"):
            tag = re.sub(r'href="([^"]*)"', lambda m: f'href="{localized_href(m.group(1), path)}"', tag)
        edits.append((start, end, tag))
    # Links inside translated texts and plain tags outside them.
    text = source
    for start, end, new in sorted(edits, reverse=True):
        text = text[:start] + new + text[end:]
    text = re.sub(r'(<a\b[^>]*?)href="([^"]*)"', lambda m: f'{m.group(1)}href="{localized_href(m.group(2), path)}"', text)
    direction = ' dir="rtl"' if rtl else ""
    text = text.replace('<html lang="en">', f'<html lang="{hreflang}"{direction}>', 1)
    text = text.replace('<meta property="og:locale" content="en_US">', f'<meta property="og:locale" content="{OG_LOCALE[path]}">', 1)
    for url in (page_url("en", page),):
        text = text.replace(f'href="{url}"', f'href="{page_url(path, page)}"')
        text = text.replace(f'content="{url}"', f'content="{page_url(path, page)}"')
        text = text.replace(f'"url": "{url}"', f'"url": "{page_url(path, page)}"')
    description = ld_description(source)
    if description:
        text = text.replace(f'"description": "{description}"', f'"description": {json.dumps(table[html.unescape(description)], ensure_ascii=False)}')
    if page in ("privacy-policy/index.html", "terms/index.html"):
        note = table["This translation is provided for convenience. If it differs from the English version, the English version applies."]
        text = re.sub(r"(</h1>)", rf'\1\n      <p class="translation-note">{html.escape(note)}</p>', text, count=1)
    return decorate(text, path, page, table["Language"])


def stamp_assets():
    """Assets are cached for a week: each page asks for its stylesheet and scripts by their content, so a new
    version reaches visitors at once."""
    import hashlib
    names = ["site.css", "site.js", "lang.js"]
    stamps = {n: hashlib.sha256((PUBLIC / "assets" / n).read_bytes()).hexdigest()[:10] for n in names}
    pattern = re.compile(r'(/assets/(site\.css|site\.js|lang\.js))(\?v=[0-9a-f]+)?"')
    for page in PUBLIC.rglob("*.html"):
        text = page.read_text()
        new = pattern.sub(lambda m: f'{m.group(1)}?v={stamps[m.group(2)]}"', text)
        if new != text:
            page.write_text(new)


def build():
    ready = []
    for path, hreflang, _, rtl in LANGS[1:]:
        if (I18N / f"{path}.json").exists() and not check(path):
            ready.append((path, hreflang, rtl))
    missing = [p for p, *_ in LANGS[1:] if p not in {r[0] for r in ready}]
    if missing:
        sys.exit(f"not built: incomplete {', '.join(missing)}")
    for page in PAGES:
        english = (PUBLIC / page).read_text()
        (PUBLIC / page).write_text(decorate(english, "en", page, "Language"))
    for path, hreflang, rtl in ready:
        table = json.loads((I18N / f"{path}.json").read_text())
        for page in PAGES:
            out = PUBLIC / path / page
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(translate(page, path, hreflang, rtl, table))
    stamp_assets()
    urls = [page_url(p, page) for page in PAGES if page != "404.html" for p, *_ in LANGS]
    (PUBLIC / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")
    print(f"built {len(ready)} languages, {len(urls)} sitemap URLs")


if __name__ == "__main__":
    command, *args = sys.argv[1:] or ["help"]
    if command == "extract":
        extract()
    elif command == "check":
        bad = False
        for lang in args:
            errors = check(lang)
            print(f"{lang}: {'ok' if not errors else f'{len(errors)} problems'}")
            for e in errors[:40]:
                print("  " + e)
            bad |= bool(errors)
        sys.exit(1 if bad else 0)
    elif command == "build":
        build()
    else:
        print(__doc__)
