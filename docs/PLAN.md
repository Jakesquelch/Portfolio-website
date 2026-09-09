# Portfolio Website — Design notes

> **Historical — superseded by the redesign.** This documents the original
> space/glassmorphic build, and most of it no longer describes the site: the
> starfield, glass utilities, Motion animations, oklch Cosmic/Daybreak
> palettes, Space Grotesk, the duration rings, the card tilt, the mobile
> hamburger and the `prefers-reduced-motion` block have all been removed. It
> also predates the blog entirely. Kept for the reasoning — particularly
> "what shipped vs. what didn't" — not as a description of the code.
>
> For how the site works now, see
> [`architecture.md`](architecture.md); for running and editing it, see
> [`../README.md`](../README.md).

## Why I'm building this

I'm a software developer, and I want a personal portfolio site that genuinely
stands out — not another grid-of-cards template. The aesthetic is
**futuristic, glassmorphic (Apple-style frosted glass), space/stars themed,
with reactive animations**, while staying **fast** (no janky 30fps scrolling).

Success criterion: the **wow-on-first-load reaction** — a visitor should
think "I haven't seen one like this before" — without sacrificing Lighthouse
performance.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | SSR, file-based routing, `next/image`, deploys to Vercel in one click |
| Styling | **Tailwind CSS v4** | Ergonomic for glassmorphism; CSS-variable tokens via `@theme inline` |
| Animation | **Motion** (formerly Framer Motion) | GPU-accelerated transforms, scroll triggers, layout animations |
| Background | **Static SVG starfield** | Server-rendered, zero JS — see "Decisions" below |
| Theme | **`next-themes`** | Dark / light toggle (Cosmic + Daybreak palettes) |
| Icons | **`lucide-react`** + inline brand SVGs | Lucide stopped shipping brand glyphs, so LinkedIn + GitHub are inlined in `components/icons.tsx` |
| Fonts | **Geist Sans + Geist Mono + Space Grotesk** | Sleek, slightly futuristic; all via `next/font` (no FOUT) |
| Deploy | **Vercel** | Zero-config |

---

## Sections that shipped

Single-page composition (`app/page.tsx`):

1. **Hero** — profile picture inside a glass medallion with a cyan→violet
   halo behind it, name in gradient text, tagline, social row (LinkedIn,
   GitHub, Contact-me button that copies the email to clipboard).
2. **About** — heading + glass card containing photo, bio paragraphs, an
   internal divider, then an embedded experience timeline. Each role renders
   as a card with a circular **duration ring** (gradient stroke wraps
   `months / 12` of the way around) joined by a gradient connector. A second
   divider closes off the experience block, then a **skills** subsection:
   three labelled chip rows (languages / frameworks / tools) sourced from
   `skills.groups` in `lib/data.ts`.
3. **Projects** — vertical stack of wide horizontal glass cards. Image on
   the left, content on the right (stacks on mobile). Each card has a 3D
   mouse-tilt on hover.

Persistent UI rendered from `app/layout.tsx`:

- **Nav** — fixed glass pill at the top centre, active section highlighted
  via Motion `layoutId`. Switches to a heavier elevated glass variant once
  you scroll off the hero so it stays legible. Mobile gets a glass hamburger
  + dropdown.
- **Starfield** — static SVG, sits behind everything at `-z-20`. Hidden in
  light mode (stars-on-cream reads as a render bug — the body's pastel
  cyan→violet mist takes over instead).
- **ThemeToggle** — glass orb in the top-right, sun ↔ moon. Mirrors the
  back-to-top button's bottom-right position.
- **BackToTop** — glass orb in the bottom-right that fades in once you've
  scrolled past ~60% of the viewport.
- **Footer** — faint divider, social icons, dynamic copyright year.

---

## Design system

Tokens live as CSS variables in `globals.css`, all in **oklch**. Two
themes share the same accent identity but invert their surface treatments.

**Cosmic** (`.dark`, the default):

- Background: deep cosmic indigo `oklch(0.08 0.02 265)`
- Foreground: cool white `oklch(0.96 0.015 250)`
- Accent cyan: `oklch(0.86 0.13 220)` (~#7dd3fc)
- Accent violet: `oklch(0.74 0.16 295)` (~#a78bfa)
- Glass surface: `oklch(1 0 0 / 4%)` over a 1px `oklch(1 0 0 / 8%)` border

**Daybreak** (light, no `.dark` class):

- Background: warm cream `oklch(0.97 0.01 80)`
- Foreground: deep cosmic indigo `oklch(0.18 0.04 265)`
- Accent cyan: `oklch(0.55 0.16 220)` (deepened for contrast on cream)
- Accent violet: `oklch(0.5 0.18 295)`
- Glass surface: `oklch(0 0 0 / 4%)` over a 1px `oklch(0 0 0 / 10%)` border —
  the frost flips from light-on-dark to dark-on-light

**Theme tokens**: glass utilities, halo gradients (behind the photos and
duration rings), and the body's two-blob nebula all read CSS variables that
are mirrored across both palettes — utilities don't need theme-aware code,
they just re-read the same var name when the toggle flips `.dark`.

Behind the starfield SVG, the body has a subtle CSS-only nebula gradient —
two soft radial blobs (violet top-left, cyan bottom-right) with
`background-attachment: fixed` so it doesn't scroll.

**Glass utilities** (`@utility` in `globals.css`):

- `.glass` — base frosted surface (4% fill, blur 20px + saturate 140%, inset
  highlight + drop shadow).
- `.glass-strong` — heavier (12% indigo fill, blur 28px). Used on the nav
  and Hero "Contact me" button.
- `.glass-strong-elevated` — bumped opacity / rim / shadow. The nav swaps to
  this once `window.scrollY > 80` so the pill stays legible against busy
  section content.

**Gradient text**: `.text-gradient` — cyan→violet linear gradient clipped to
text. Used on the H1 and the experience-card company names.

**Type scale**: Geist for body, Space Grotesk (`--font-heading`) for
`<h1>`/`<h2>`/`<h3>`, slight negative letter-spacing on display sizes.

---

## The "wow" layer — what shipped vs. what didn't

What shipped:

1. **Glass nav with morphing pill** — Motion `layoutId` slides the active
   indicator between links. Heavier glass variant once scrolled.
2. **Glass project cards with 3D tilt** — CSS `perspective` + cursor-driven
   `rotateX/Y` mutated directly on the DOM (no React re-renders). Cheap;
   runs on the compositor.
3. **Cyan→violet halos** behind the hero photo, about photo, and duration
   rings — soft radial gradients with `blur-3xl` / `blur-2xl`.
4. **Animated duration rings** — SVG circle with `strokeDasharray` /
   `strokeDashoffset` animated by Motion when each experience card scrolls
   into view.
5. **Email-to-clipboard Contact button** — `Mail` icon flips to a checkmark
   for ~2s after click (so visitors without a default mail client still
   walk away with the address).

What I dropped (and why):

- **WebGL starfield** (`@react-three/fiber` + instanced points). Originally
  planned, but a seeded-PRNG static SVG with 300 circles got me 95% of the
  visual at 0% of the JS bundle and zero runtime cost. Dropped the deps.
- **Cursor stardust trail** — felt fussy and a magnet for jank on lower-end
  devices. Cut.
- **Constellation skill grid** — replaced with the experience timeline,
  which says more about me. The skills section was scaffolding I never
  needed.
- **Scroll-driven camera depth** — N/A once the WebGL starfield was cut.
- **Aurora mesh on hero** — replaced with the simpler radial halo behind
  the photo.

---

## Performance guardrails (still non-negotiable)

- **Starfield**: server-rendered SVG, single static markup, no JS.
- **Reduced motion**: a global `@media (prefers-reduced-motion: reduce)`
  block in `globals.css` collapses every animation/transition to ~0ms.
  Motion's `whileInView` etc. become no-ops at that duration.
- **Animations on transform / opacity only** — never `top`/`left`/`width`.
- **`next/image`** for profile and about photos with explicit `sizes` and
  `priority` only on the hero.
- **Scroll listeners** are `{ passive: true }` and only do trivial state
  flips.
- **Project tilt** mutates `el.style.transform` in a mousemove handler — no
  React rerenders.
- **Lighthouse target**: Performance ≥90, A11y ≥95.

---

## Verification

1. **Visual check** — `npm run dev`, scroll through every section. Confirm
   stars render, glass panels look frosted, nav highlights active section
   and switches to its elevated variant past the hero, project cards tilt
   on hover, back-to-top fades in, footer year is current.
2. **Reduced motion** — toggle `prefers-reduced-motion: reduce` in DevTools.
   Confirm animations and smooth scrolling are disabled.
3. **Mobile** — DevTools device emulation (iPhone 14, Pixel 7). Confirm
   layout stacks, hamburger menu opens / closes / closes on outside-click,
   no horizontal scroll.
4. **Lighthouse** — Performance ≥90, A11y ≥95, Best Practices ≥95, SEO ≥95.
5. **Build** — `npm run build` passes with no TypeScript or ESLint errors.
6. **OG card** — visit `/opengraph-image` directly; share a link in Slack /
   iMessage / Twitter and confirm the card renders.
7. **Deploy** — push to Vercel, verify production URL renders identically.

---

## Future work

- **More project entries** — `lib/data.ts` currently has the Weather App.
  Drop additional screenshots into `public/` and append entries.
