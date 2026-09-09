# Portfolio Website

![The site in dark mode — hero and about section](docs/screenshot.png)

My personal portfolio site. The goal is to give a bit more background on me than
a CV does — who I am, where I've worked, and what I've been building — plus a
blog, in a format I can update and push.

It's deliberately quiet. No animation library, no hero video, no scroll-jacking.
Neutral ground, one violet accent, and a recurring monospace-label motif. The
content is the point; the design just gets out of its way.

Live at **<https://jake-squelch.vercel.app>**.

## Running it

One script, one terminal:

```bash
./run.sh
```

Then open http://localhost:3000.

That installs dependencies if `node_modules` is missing or `package-lock.json`
has changed since the last install, then starts the Next dev server with hot
reload. On a fresh clone it does the whole setup for you.

```bash
./run.sh prod         # production build, then serve it
./run.sh --port 4000  # either mode, different port
./run.sh --help
```

One gotcha: Next 16 only allows a single dev server per project directory. If
one is already running, the script will start and then Next bails out with the
port and PID of the existing one — use that server, or `taskkill /PID <pid> /F`
(`kill <pid>` on mac/linux) and re-run.

### Required Software

- **Node.js** (v18 or higher, I'm on v22.20.0)
- **npm** (I'm on 11.6.4)

That's it — no database, no backend, nothing to configure.

---

## Running it manually

If you'd rather not use the script, or want to know what it's doing:

```bash
npm i
npm run dev
```

```bash
npm run build       # production build
npm run start       # serve the build (needs build first)
npm run lint        # eslint
npm run format      # prettier, incl. re-wrapping post prose to 80 columns
```

---

## Editing the content

The homepage copy and data all live in one file:
[`lib/data.ts`](lib/data.ts). Section headings are hardcoded in the JSX —
everything that actually changes lives in the data file. (Blog posts are the
exception: they're MDX files, see [below](#writing-a-post).)

- `socials` — LinkedIn / GitHub / email, shared by the nav, hero and footer
- `aboutParagraphs` — the bio, rendered in order
- `experiences[]` — one row per job. `logo` needs the image's natural
  width/height so `next/image` knows the aspect ratio
- `skillGroups[]` — each group renders as one labelled line
- `projects[]` — each renders as a horizontal card. Set `image` or `github` to
  `null` for the placeholder / "coming soon" fallbacks; set `imageBg` to the
  screenshot's own background colour so its letterboxing blends in

### Writing a post

Posts are `.mdx` files in [`content/posts/`](content/posts). **The filename is
the URL** — `content/posts/homelabbing.mdx` is served at `/blog/homelabbing` —
and dropping a file in that directory is the entire publishing step. There's no
index to keep in sync.

Each post opens with a `meta` block, which drives the listing card, the `<h1>`,
the page title and the social preview image:

```tsx
export const meta = {
  title: "Homelabbing 101",
  date: "2026-09-07", // ISO; the listing sorts newest-first on this string
  summary: "One line that shows up on the listing card.",
  tags: ["Homelab"],
};
```

Everything below it is markdown, styled by
[`mdx-components.tsx`](mdx-components.tsx) at the project root — that file maps
each HTML tag onto the site's type scale, so posts need no wrapper class and no
prose plugin. Because it's MDX rather than plain markdown, a post can also
`import` a React component and drop it inline; `homelabbing.mdx` does this for
the network diagram in [`components/diagrams/`](components/diagrams).

Prose in posts is hard-wrapped at 80 columns. Don't do that by hand — Prettier
is configured with `proseWrap: "always"`, so `npm run format` (or format-on-save
in the editor) re-flows a paragraph after you edit it.

---

## The design — "Violet Thread"

Two palettes, mirrored token-for-token in `app/globals.css` (7 CSS variables
each), switched by `next-themes`:

- **Dark** (the default): soft graphite `#161618` — not black — with a lighter
  violet `#a78bfa` accent
- **Light**: white ground, near-black ink, deep violet `#6d28d9`
- `--chip` stays light in both themes, because the company logos and project
  screenshots are all authored against light backgrounds

Geist Mono carries the motif: section labels, nav links, dates and locations,
skill group labels, project tag chips. Everything else is Geist Sans. The only
motion anywhere is ~200ms colour and opacity transitions on hover, the theme
cross-fade, and smooth scrolling.

### What's on the site

Three routes: the homepage (`/`), the blog index (`/blog`) and a page per post
(`/blog/<slug>`).

`app/page.tsx` composes the homepage as a single column:

1. **Hero** — name and role on the left, circular photo on the right (stacks
   photo-first on mobile). Social buttons plus a Contact button that copies the
   email to the clipboard as well as firing the `mailto:`
2. **About** — bio paragraphs and a one-line-per-group skills block
3. **Experience** — one row per job: wordmark on a light chip, role and context,
   period and location in mono
4. **Projects** — wide horizontal cards, image left (~38%), content right,
   stacking on mobile

The blog is two further pages, both driven entirely by the files in
`content/posts/`:

5. **Blog index** (`app/blog/page.tsx`) — one card per post, newest first, each
   showing date, tags, title and summary
6. **Post** (`app/blog/[slug]/page.tsx`) — a back-link, the title/date/tags
   header, then the compiled MDX body

And from `app/layout.tsx`, on every screen:

- **Nav** — sticky bar. The name on the left only fades in once you've scrolled
  past the hero, so the page never reads "Jake Squelch" twice at once. On the
  homepage an IntersectionObserver drives the active-link highlight; away from
  it the three section links become `/#…` links back to the homepage and Blog
  highlights on the pathname instead. No hamburger — the four links fit on
  mobile once the name hides below `sm`
- **ThemeToggle** — bordered circle in the nav, sun ↔ moon
- **BackToTop** — fades in past ~60% of the viewport height, aligned to the
  content column's right edge rather than the viewport's
- **Footer** — hairline rule, socials, copyright

---

## Performance

The site should be close to free to load, and mostly is:

- About, Experience, Projects, Footer and both blog pages are **server
  components** — they ship no JavaScript at all
- Client JS is limited to four things: the nav (observer + smooth scroll), the
  theme toggle, the hero contact button, and back-to-top
- Scroll listeners are all `{ passive: true }`
- `next/image` everywhere with explicit `sizes`; `priority` on the hero photo
  only
- Motion is minimal by design (~200ms colour/opacity transitions, no keyframes),
  so `prefers-reduced-motion` isn't specially handled

---

## Technology Stack

- **OS:** Windows
- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 with a CSS-variable token set (7 per theme)
- **Theming:** next-themes, dark by default
- **Blog:** MDX via `@next/mdx`, posts as files in `content/posts/`
- **Formatting:** Prettier (`proseWrap: "always"` — posts wrap at 80 columns)
- **Fonts:** Geist Sans + Geist Mono via `next/font`
- **Hosting:** Vercel
- **AI Model:** Claude Code Pro

## Deploying

`git push` to a branch Vercel tracks and it builds and deploys on push. Nothing
else to do — no env vars, no build config.

## Docs

- [`docs/architecture.md`](docs/architecture.md) — how it's built and why
- [`docs/PLAN.md`](docs/PLAN.md) — the original build plan
- [`docs/tracker.md`](docs/tracker.md) — running log of sessions and decisions
- [`docs/next-steps.md`](docs/next-steps.md) — what's next
