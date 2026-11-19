<div align="center">

# MimoDays - Website

**Little moments. Your whole life.**

The promotional website for [MimoDays](https://github.com/Dronnn/mimodays-ios), a private memory journal for iPhone and iPad.

![Status](https://img.shields.io/badge/status-pre--launch-DFE9D0?style=flat-square)
![Type](https://img.shields.io/badge/site-static-F5AD5E?style=flat-square)
![Accessibility](https://img.shields.io/badge/target-WCAG%202.2%20AA-4B2938?style=flat-square)

</div>

---

## The idea

*The ordinary is worth keeping.*

The site should feel like someone is quietly showing you a beautiful archive of everyday life: cream paper, real candid photography, small coral stars, and a film reel waiting at the end. It's closer to a short visual essay than a feature catalog.

A visitor should leave understanding three things:

1. **It arrives unexpectedly.** A gentle random reminder, not a staged best day.
2. **It captures both sides.** The scene in front of you and your own face, in one memory.
3. **It becomes a story.** Months and years of little moments, revisited by date or place and turned into a personal movie.

And one more: **it's private.** No feed, no followers, no pressure.

## What this repository is

- A **separate project** from the iOS app: no shared runtime, no user database, no private memories stored here.
- A **plain static site**: HTML, one stylesheet and one small script. No build step, no dependencies, no cookies, no analytics.
- **Honest by design.** No invented App Store links, prices, ratings, testimonials or launch dates. Every claim has to match the shipped app.

## Pages

| Route | Purpose |
|---|---|
| `/` | The story: surprise, two cameras, note and voice, memories, movie, privacy, FAQ |
| `/privacy-policy/` | The privacy policy |
| `/terms/` | Terms of use |
| `/support/` | How to get help |
| `/<language>/…` | The same pages in each of the app's other 21 languages, e.g. `/de/`, `/pt-br/support/`, `/zh-hant/terms/` |

## How it works

- On wide screens one phone stays in place while the chapters scroll past; it plays each chapter's recording from the app (`assets/video/`, 552×1200 H.264, muted, with a poster). A video plays only while its chapter is in view, and with Reduce Motion only the poster shows. On narrow screens each chapter has its own phone, played while it is on screen.
- Cards get the app's hand-cut outline from `assets/site.js`; without JavaScript they fall back to plain rounded cards.
- Fonts are the app's own, one set per alphabet (Latin: Grandstander, Comfortaa, Shantell Sans; Cyrillic headings in Balsamiq Sans; Hebrew, Arabic, Armenian, Georgian, Japanese, Korean and Chinese have theirs). `site.css` picks them by the page's language; each is cut to the letters the pages use and served from this site (SIL OFL, licences in `assets/fonts/`).
- Until the app is on the App Store the site says "Coming soon to the App Store" in plain text. Apple's badge is only for apps already available, used unmodified and linked to the product page; it replaces that line at release.

## Languages

The site speaks the app's 22 languages. The English pages in `public/` are the source; `tools/i18n.py` makes the others.

- `python3 tools/i18n.py extract` collects every text of the English pages into `i18n/source.json`.
- `i18n/<language>.json` holds that language's text for each English one, with the same markup inside. `python3 tools/i18n.py check <language>` confirms nothing is missing and no tag or link changed.
- `python3 tools/i18n.py build` writes `public/<language>/…`, adds the language menu (footer) and `hreflang` alternates to every page, English included, and rewrites `sitemap.xml`.

After changing English copy: extract, update the languages, check, build. Pages under `public/<language>/` are generated; edit the English page or the language file, not them.

On a first visit to an English page, `assets/lang.js` moves the visitor to their browser's language if the site has it. A language picked in the footer menu is remembered and wins. Arabic and Hebrew pages are right to left; the stylesheet uses logical properties for that.

## Files

Everything the site serves is in `public/`. It's plain HTML, so `public/index.html` opens straight from disk; links between pages and the videos need it served, as below.

## Run locally

```sh
cd public && python3 -m http.server 8765
```

Then open http://127.0.0.1:8765.

## Deploy

https://mimodays.mrmaier.com is a Cloudflare Worker that serves `public/` as static files (`wrangler.jsonc`; `_headers` sets the security headers, `404.html` is the not-found page). Cloudflare Workers Builds deploys `main` on every push. Work happens on `develop` and reaches the site through a pull request into `main`.

## License

Copyright (c) 2026 Andrew Maier. All rights reserved.
The source is public so people can read it. It is not licensed for reuse or redistribution. Brand assets, photography and copy are not to be reused.
