# Architecture

How this project is put together — the rendering model, the data flow, the
theming system, and the reasoning behind the structure. For the quick
"how do I run / edit this" guide see the [README](../README.md).

## At a glance

```
Browser ── GET ──▶ Vercel (static prerender)
                      │
                      ▼
  app/layout.tsx  ──  fonts, metadata, ThemeProvider, Nav / Footer / BackToTop
    │
    ├─ app/page.tsx       ──  Hero · About · Experience · Projects
    │    ▲
    │    │  typed data (no fetching — content is local)
    │  lib/data.ts        ──  socials · aboutParagraphs · experiences ·
    │                         skillGroups · projects
    │
    ├─ app/blog/page.tsx  ──  post cards, newest first
    └─ app/blog/[slug]/   ──  meta header + compiled MDX body
         ▲
         │  fs.readdir + dynamic import, both at build time
       lib/posts.ts       ──  content/posts/*.mdx
```

- **Framework**: Next.js 16, App Router, TypeScript, React 19.
- **Rendering**: the entire site is **prerendered at build time**. The
  homepage and blog index are `○ Static`; the per-post route and its OG
  card are `● SSG`, enumerated by `generateStaticParams`. Either way there
  is no server runtime work, no API routes, no database — content changes
  ship as commits.
- **Hosting**: Vercel, deploy-on-push.

## Directory structure

```
app/                     # Next.js App Router root
  layout.tsx             # root layout: fonts, metadata, ThemeProvider,
                         #   persistent UI (Nav, Footer, BackToTop)
  page.tsx               # the homepage: composes the four sections
  globals.css            # Tailwind v4 entry + the two token palettes
  icon.svg               # favicon (auto-served by App Router convention)
  opengraph-image.tsx    # dynamic OG card, rendered to PNG at build time
  blog/
    page.tsx             # server — the post listing
    [slug]/
      page.tsx           # server — one post, body compiled from MDX
      opengraph-image.tsx  # per-post OG card, carrying the post's title
mdx-components.tsx       # REQUIRED at the project root by @next/mdx:
                         #   maps markdown's HTML tags onto the type scale
content/
  posts/*.mdx            # the posts themselves — filename is the slug
components/
  sections/              # one file per homepage section
    hero.tsx             # client — clipboard interaction
    about.tsx            # server — pure data rendering
    experience.tsx       # server — pure data rendering
    projects.tsx         # server — pure data rendering
  diagrams/              # server — inline SVG figures imported by posts
  nav.tsx                # client — pathname + scroll + IntersectionObserver
  section-label.tsx      # server — the mono heading motif
  theme-toggle.tsx       # client — next-themes hook
  back-to-top.tsx        # client — scroll state
  footer.tsx             # server
  icons.tsx              # inline brand SVGs (GitHub, LinkedIn)
lib/
  data.ts                # all homepage content, as typed exported constants
  posts.ts               # build-time blog index over content/posts/
  utils.ts               # cn() = clsx + tailwind-merge
public/                  # images referenced by lib/data.ts (logos,
                         #   screenshots, profile photo)
docs/                    # this file + personal working notes
```

## Content model — `lib/data.ts`

The single most important architectural decision: **components render
data; they contain no copy.** Every string a visitor reads on the homepage
lives in `lib/data.ts` as a typed constant — the exceptions are
micro-labels like "View on GitHub" and the section headings themselves,
which name the layout rather than being content anyone would edit. (Blog
posts are the other exception, and get their own model below.)

| Export             | Type                          | Rendered by         |
| ------------------ | ----------------------------- | ------------------- |
| `socials`          | `{ linkedin, github, email }` | Hero, Footer        |
| `aboutParagraphs`  | `string[]`                    | About               |
| `experiences`      | `Experience[]`                | Experience (rows)   |
| `skillGroups`      | `{ label, items }[]`          | About (label lines) |
| `projects`         | `Project[]`                   | Projects (cards)    |

Adding a job or project is appending an object (plus dropping an image in
`public/`); the components iterate arrays, so no markup changes. The
`satisfies` operator keeps entries checked against the `Experience` /
`Project` types while preserving literal types.

## Content model — the blog

Posts are `.mdx` files in `content/posts/`, and **the filesystem is the
index**: the filename is the slug, so publishing is dropping a file in the
directory. There is no manifest to keep in sync and no CMS.

Each post exports a `meta` block (`title`, `date`, `summary`, optional
`tags`). That one object drives the listing card, the `<h1>`, the
`<title>`, the meta description and the OG card — the page shell reads it,
so a post is authored entirely in its own file.

`lib/posts.ts` is the whole data layer, server-only and build-time:

| Function          | Does                                                   |
| ----------------- | ------------------------------------------------------ |
| `getPostSlugs`    | every slug; backs `generateStaticParams`               |
| `getPost`         | dynamic `import()` of one post → `{ Body, meta }`      |
| `getPostMeta`     | just the `meta` block, for listings and metadata       |
| `getAllPosts`     | every post, sorted newest-first on the ISO date string |
| `formatPostDate`  | renders "7 September 2026"                             |

Four constraints in there are load-bearing and easy to break:

- **The dynamic import needs a static prefix and a literal extension**
  (`@/content/posts/${slug}.mdx`). That's what lets the bundler build a
  lookup over the directory rather than needing every post listed by hand.
  Making the path fully dynamic breaks the build, not just the page.
- **`dynamicParams = false`** on the post route: an unknown slug 404s
  instead of being rendered on demand. There's no post source outside the
  repo, so on-demand rendering could only ever produce a miss.
- **`formatPostDate` pins the locale to `en-GB`.** These dates render at
  build time on a server whose locale is nobody's business; leaving it to
  the runtime would show up as a hydration mismatch.
- **The OG route needs its own `generateStaticParams`.**
  `opengraph-image.tsx` compiles to a separate route from the page it sits
  beside, so without it every card would render on demand.

### How MDX is wired

- `next.config.ts` wraps the config in `createMDX({})`. **`pageExtensions`
  is deliberately left alone** — adding `"mdx"` there would make any stray
  `.mdx` file under `app/` become a route. Posts are imported, not routed.
- `mdx-components.tsx` **must exist at the project root**; the App Router
  won't compile MDX without it. It maps each HTML tag markdown produces
  (`p`, `h2`, `ul`, `pre`, `a`, …) onto the site's type scale and tokens,
  which is why posts need no wrapper class and no prose plugin. Note it
  merges any incoming `className` rather than spreading props over the top:
  MDX sets one itself on fenced code, and a plain `{...props}` after
  `className=` would silently drop the styling.
- A `#` heading inside a post is mapped to `h2`, because the page already
  renders the title as the `h1`.
- **Remark/rehype plugins must be named as strings**, not imported
  functions — Turbopack can't pass JS functions across to its Rust core.
- Because it's MDX, a post can `import` a React component and drop it
  inline. `homelabbing.mdx` does this for `components/diagrams/tailnet.tsx`.
  Those diagrams are server components drawing inline SVG against the theme
  tokens, so they cost no client JS and follow the theme toggle.

Post prose is hard-wrapped at 80 columns by Prettier (`proseWrap:
"always"` in `.prettierrc.json`), so paragraphs re-flow on save instead of
being wrapped by hand.

## Rendering model — server by default

Only four components ship JavaScript to the browser; everything else is a
React Server Component rendered to static HTML at build time:

| Client component | Why it needs JS                                      |
| ---------------- | ---------------------------------------------------- |
| `nav.tsx`        | IntersectionObserver active-section highlight; show-name-after-hero scroll state; same-hash re-scroll fix; homepage/blog mode from `usePathname` |
| `theme-toggle.tsx` | reads/writes the theme via `next-themes`           |
| `hero.tsx`       | "Contact me" copies the email to the clipboard       |
| `back-to-top.tsx`  | visibility tracks scroll position                  |

There is **no animation library**. Motion is limited to ~200ms CSS
transitions (hover states, theme cross-fade, the two fade-in buttons) and
smooth scrolling — no keyframes, no transforms beyond an 8px slide on the
back-to-top button.

`prefers-reduced-motion` is deliberately not handled. The motion here is
small enough that gating it wasn't worth the code on a single-page personal
site; visitors with the OS setting on get the same ~200ms fades as everyone
else.

## Theming

Three cooperating layers:

1. **`next-themes`** (`ThemeProvider` imported straight into
   `layout.tsx` — the package ships its own `"use client"` directive, so
   no local wrapper component is needed): dark is the
   default for everyone (`defaultTheme="dark"`, `enableSystem={false}`);
   the nav toggle switches to light and persists the choice in
   `localStorage`. The library toggles a `.dark` class on `<html>` before
   first paint (hence `suppressHydrationWarning` there).
2. **CSS variables** (`globals.css`): seven tokens per theme —
   `--background`, `--foreground`, `--muted-foreground`, `--line`,
   `--accent`, `--surface`, `--chip` — defined once under `:root` (light)
   and mirrored under `.dark`. Components never branch on theme; they
   reference tokens and the palette flips under them.
3. **Tailwind v4** (`@theme inline`): maps each variable to a utility
   namespace (`bg-background`, `text-accent`, `border-line`, …) and wires
   `dark:` to the class strategy via `@custom-variant`.

Palette ("Violet Thread"): dark = graphite `#161618` ground with violet
`#a78bfa` accent; light = white ground with deep violet `#6d28d9`. The
one asymmetric token is `--chip`, which stays light in both themes because
company wordmarks and screenshots are authored against light grounds.

The `ThemeToggle` uses `useSyncExternalStore` with different server/client
snapshots to render a placeholder until hydration — `resolvedTheme` is
unknowable on the server, and this avoids both a hydration mismatch and a
layout shift.

## Typography

Two faces, loaded through `next/font/google` (self-hosted at build time,
zero external requests, no FOUT):

- **Geist Sans** — everything by default (`--font-sans`).
- **Geist Mono** — the design's single motif: section labels, nav links,
  dates/locations, skill group labels, tag chips (`--font-mono`).

## Images

All images go through `next/image`:

- Hero photo: `fill` + explicit `sizes` + `priority` (it's the LCP
  element); `objectPosition: "center 22%"` biases the circular crop
  upward.
- Company logos: natural width/height recorded in `lib/data.ts` so the
  aspect ratio is known at build time; scaled by height in CSS.
- Project screenshots: `fill` with `object-contain`, so shots are
  letterboxed rather than cropped. The backdrop behind the letterboxing is
  `imageBg` per project, falling back to the light `--chip` token.

## SEO / sharing

- `app/layout.tsx` exports the `Metadata` object: title template,
  description, OpenGraph + Twitter card fields, `metadataBase` so relative
  image URLs resolve absolutely.
- `app/opengraph-image.tsx` renders the share card with `next/og`
  (Satori) at build time — App Router picks it up by file convention and
  injects the `og:image` tags automatically.
- `app/blog/[slug]/opengraph-image.tsx` does the same per post, carrying
  the post's own title so a shared link previews as the article rather
  than as the homepage. Long titles step down through three font sizes
  instead of wrapping to four cramped lines. Satori's CSS support is
  limited: every flex container needs an explicit `display: flex` and
  colours must be plain hex, so the palette is duplicated there as
  literals rather than read from the tokens.
- `app/blog/[slug]/page.tsx` exports `generateMetadata`, feeding the
  post's title into the `"%s | Jake Squelch"` template and its summary
  into the description and card.
- `app/icon.svg` becomes the favicon the same way.

## Navigation behaviour worth knowing

- The nav has **two modes, keyed off the pathname**. On the homepage the
  three section links are in-page anchors with the active one highlighted
  by IntersectionObserver. On any other route — i.e. the blog — those same
  links become `/#…` links back to the homepage, the observer is skipped
  entirely, and Blog highlights on the pathname instead. The name on the
  left is always shown off the homepage, since there's no hero to duplicate.
- Anchor scrolling is handled manually in `nav.tsx` because native hash
  navigation no-ops when the URL hash already matches the target (click
  "About", scroll away, click "About" again). `history.replaceState`
  keeps the URL in sync without polluting history.
- `scroll-padding-top` in `globals.css` stops the sticky nav from
  covering section headings on anchor jumps.
- The nav name is hidden until the hero scrolls out of view (the hero
  already opens with the name at display size) and doubles as a
  scroll-to-top button.
- Both routes back to the top — the nav name and the `BackToTop` button —
  clear the section hash from the URL, so it doesn't still read
  `#projects` once you're sitting at the top of the page.
- `BackToTop`'s `right` offset is computed from the same `max-w-3xl` /
  `max-w-4xl` + `px-6` maths as the content column, so it aligns with the
  content edge on wide screens instead of drifting to the viewport edge.

## Build & deploy

```
npm run dev     # Turbopack dev server on :3000
npm run build   # production build — every route prerenders static
npm run lint    # eslint (next/core-web-vitals config)
npm run format  # prettier over the repo (see proseWrap note above)
```

Pushes to the tracked branch deploy via Vercel. The production domain is
<https://jake-squelch.vercel.app>. Because the whole site is static, a
deploy is effectively a CDN cache refresh — there are no runtime
environment variables, secrets, or services to configure.

## Dependency policy

Runtime dependencies are deliberately minimal: `next`, `react`,
`react-dom`, `next-themes`, `lucide-react` (utility icons), `clsx` +
`tailwind-merge` (the `cn()` helper), plus `@next/mdx` with
`@mdx-js/loader` / `@mdx-js/react` (and `@types/mdx`) for the blog. Brand
icons that lucide doesn't ship (GitHub, LinkedIn) are inlined as SVG paths
in `components/icons.tsx` rather than pulling in an icon-pack dependency.

The MDX packages are the only dependency the blog added — no prose plugin
(`mdx-components.tsx` covers the styling), no syntax highlighter, no date
library (`toLocaleDateString` covers it), no reading-time package.
Diagrams are hand-written inline SVG rather than a charting or diagram
dependency. `prettier` is a devDependency, pinned exactly so a version
bump can't silently re-wrap every post.
