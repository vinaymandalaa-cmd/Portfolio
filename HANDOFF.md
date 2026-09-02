# Vinay Mandala — portfolio handoff

Seven standalone pages. Each opens directly in a browser; there is no build step.

## Pages

| File | What it is |
| --- | --- |
| `Vinay Mandala.dc.html` | Home. Chapters 00–11, the plan→interface morph, work grid, about teaser, contact. |
| `About.dc.html` | Seven folds, quick-facts strip under the hero. |
| `Resume.dc.html` | One-page résumé, print-ready. |
| `Siya.dc.html` | Case 01. Thirteen numbered sections. NDA product — schematics instead of screens where required. |
| `Mavricks.dc.html` | Case 02. |
| `NerdyOtaku.dc.html` | Case 03. Fully open, Figma linked. |
| `Drop.dc.html` | Case 04. Fully open, Figma + prototype linked. |

Each case study opens with an **At a glance** block: role, timeline, what I owned, who I worked with, where it landed.

## Motion

All scroll motion comes from one shared file, `motion.js`, loaded per page with a `data-accent` colour. Nothing else animates on scroll — there are no inline scroll-timeline animations left in the pages.

What it does:

- **Four reveal variants**, chosen per element: body blocks rise 12px, small caps labels fade only, hairline rules draw from the left, grid tiles rise 9px on a 55ms stagger.
- **Count-up** on stat numerals (skips years and IDs).
- **Parallax**: max 14px, desktop only, capped at 8 tall images, applied with the `translate` property so it never fights an element's own transform.
- **Hover**: lift on links and cards, 1.03 zoom inside image frames. Disabled on touch.
- **Scroll rail**: skipped on pages that draw their own.
- Full `prefers-reduced-motion` opt-out.

The home page's "person behind the pixels" fold has its own ~6s sequence, defined in that page's logic class. It never locks scroll.

## Breakpoints

- `≤900px` — dense card grids marked `data-om-stack` go 2-up; the chapter 03 lead column stops being sticky.
- `≤760px` — the morph widget switches to 4:5, its labels shrink and wrap; the "also on the desk" list loses its indent.
- `≤700px` — reveal distances shorten, image scale-in is off.
- `≤560px` — `data-om-stack` grids go single column.

Nothing on any page renders below 11px.

## Navigation

Top nav on every case study: back to the home story on the left, case number and a **Next →** link on the right. The chain is siya → Mavricks → Nerdy Otaku → Drop → siya, and the same order repeats in the footer nav of each page. Home links to all four from the "Four worlds" grid; About and Résumé are reachable from every nav.

## Assets

`assets/` and `siya/` hold only what the pages reference. Nerdy Otaku screens and Siya mascot/social imagery were re-encoded to webp at 1200px max side (24–46kb each).

Paths are assembled from prefix constants inside each page's logic class (`const A = 'assets/no/'`, `const S = 'assets/siya/'`), so a plain text search for a filename will not find every reference — resolve the prefixes before deciding an asset is unused.

One thing left for you: `assets/no/onboarding.gif` is 11.5MB. It only downloads when someone presses play, but converting it to mp4 and swapping the `<img>` for a `<video autoplay muted playsinline>` would cut it to roughly 1MB.

## Contact details in the build

Email `vinaymandalaa@gmail.com`, phone `+91 70322 63322`, LinkedIn `in/vinay-mandala`, product `heysiya.ai`. Update these in every page's contact fold and nav if they change.
