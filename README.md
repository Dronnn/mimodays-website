<div align="center">

# MimoDays - Website

**Little moments. Your whole life.**

The promotional website for [MimoDays](https://github.com/Dronnn/mimodays-ios), a private memory journal for iPhone and iPad.

![Status](https://img.shields.io/badge/status-design%20phase-DFE9D0?style=flat-square)
![Type](https://img.shields.io/badge/site-static%20first-F5AD5E?style=flat-square)
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
- A **static-first** marketing site. JavaScript is used only for the small interactive demos, the menu, accordions and video controls.
- **Honest by design.** No invented App Store links, prices, ratings, testimonials or launch dates. Every claim has to match the shipped app.

## Planned pages

| Route | Purpose |
|---|---|
| `/` | The full story and the main call to action |
| `/how-it-works` | Capture → archive → movie, step by step |
| `/features` | Features grouped by what you get out of them |
| `/privacy` | A plain-language privacy explanation |
| `/faq` | Devices, permissions, timing, storage, export |
| `/support` | A real way to get help |
| `/privacy-policy` | The legal policy |

## Quality targets

- **Accessibility:** WCAG 2.2 AA, full keyboard support, `prefers-reduced-motion` respected
- **Performance:** Core Web Vitals in the good range (LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms)
- **Tests:** unit and component tests, end-to-end visitor flows, automated accessibility checks, and visual regression at desktop, tablet and mobile sizes

## Status

The site is being designed. The stack and hosting will be chosen before implementation starts, and this README will then gain setup and development instructions.

## License

Copyright (c) 2026 Andrew Maier. All rights reserved.

The source is public so people can read it. It is not licensed for reuse or redistribution. Brand assets, photography and copy are not to be reused.
