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

## How it works

- On wide screens one phone stays in place while the chapters scroll past; it shows each chapter's screen (`assets/screens/`). Video recordings will replace the stills: any `<video data-screen="...">` in the phone plays only while its chapter is in view, and never with Reduce Motion.
- Cards get the app's hand-cut outline from `assets/site.js`; without JavaScript they fall back to plain rounded cards.
- Fonts (Fraunces, Nunito, Inter, Patrick Hand, all SIL OFL) are subset copies of the app's fonts, served from this site.
- The App Store badge is shown but not linked until the app is live.

## Run locally

```sh
python3 -m http.server 8765
```

Then open http://127.0.0.1:8765.

## Hosting

Cloudflare Pages, deployed from this repository (`main`), no build command, output directory `/`. `_headers` sets the security headers.

## License

Copyright (c) 2026 Andrew Maier. All rights reserved.

The source is public so people can read it. It is not licensed for reuse or redistribution. Brand assets, photography and copy are not to be reused.
