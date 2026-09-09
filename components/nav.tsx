"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

/** Anchor sections — these all live on the homepage. */
const SECTIONS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
] as const;

/**
 * Sticky top nav — name on the left (scrolls to top), mono section links +
 * Blog + theme toggle on the right. The links are short enough that the same
 * row works on mobile, so there's no hamburger.
 *
 * Two modes, keyed off the pathname. On the homepage the section links are
 * in-page anchors with a manual smooth scroll, and the active one is tracked
 * by IntersectionObserver. On any other route (the blog) those same links
 * become ordinary `/#id` navigations back to the homepage — the scroll
 * handling below would otherwise look for elements that don't exist on the
 * page and silently do nothing.
 */
export function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  /**
   * Both of these are derived rather than stored for the off-homepage case:
   * writing them from an effect would be a synchronous setState in the effect
   * body (a cascading render, and a lint error), and there's nothing to track
   * on a route that has neither the hero nor the sections.
   */
  const showName = !isHome || scrolledPastHero;
  const active = isHome ? activeSection : null;

  /**
   * The nav name only fades in once the hero (which opens with the same
   * name at display size) is scrolled out of view — otherwise the page
   * reads "Jake Squelch" twice in the same glance. Off the homepage there's
   * no hero to collide with, so it's simply always visible.
   */
  useEffect(() => {
    if (!isHome) return;

    const onScroll = () => {
      setScrolledPastHero(window.scrollY > window.innerHeight * 0.4);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  /**
   * IntersectionObserver tracks which section is currently in the viewport.
   * The rootMargin "-40% 0px -40% 0px" means a section only counts as active
   * when it's near the middle of the viewport — feels more natural than
   * triggering at the edges. On the hero neither link is active.
   *
   * Short sections mean two can occupy that middle band at once (e.g.
   * jumping to Experience also puts the top of Projects in the band), so
   * we keep a set of everything currently intersecting and highlight the
   * topmost in document order — not whichever entry happened to fire last.
   *
   * Only the homepage has these sections; elsewhere the highlight is driven
   * by the pathname instead (Blog, below).
   */
  useEffect(() => {
    if (!isHome) return;

    const inView = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            inView.add(entry.target.id);
          } else {
            inView.delete(entry.target.id);
          }
        }
        const topmost = SECTIONS.find(({ id }) => inView.has(id));
        setActiveSection(topmost ? topmost.id : null);
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );

    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [isHome]);

  /**
   * Manual scroll handler for nav links, used on the homepage only. Bypasses
   * the browser's default hash navigation, which no-ops when the URL hash
   * already matches the target — e.g. you click "About", scroll back to the
   * hero by hand, then click "About" again: the URL is still `#about`, so the
   * browser thinks it's already there and doesn't scroll. Doing it ourselves
   * avoids that, and `history.replaceState` keeps the URL in sync without
   * polluting history with a new entry per click.
   *
   * Modifier-clicks (cmd/ctrl/shift, middle-button) fall through to default
   * behaviour so the browser still handles "open in new tab" sensibly.
   */
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  const handleNameClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", window.location.pathname);
  };

  const isBlog = pathname.startsWith("/blog");

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background">
      <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6 lg:max-w-4xl">
        {/* On the homepage the name scrolls back to the top; elsewhere it's
            the way home, so it has to be a real link. */}
        {isHome ? (
          <button
            type="button"
            onClick={handleNameClick}
            aria-hidden={!showName}
            tabIndex={showName ? 0 : -1}
            className={cn(
              "hidden text-sm font-semibold tracking-tight text-foreground transition-opacity duration-200 sm:block",
              showName ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            Jake Squelch
          </button>
        ) : (
          <Link
            href="/"
            className="hidden text-sm font-semibold tracking-tight text-foreground sm:block"
          >
            Jake Squelch
          </Link>
        )}

        {/* On mobile the name button above is `hidden`, which removes it from
            flex layout — `justify-between` would then strand this group at the
            left edge. Taking the full width and centring restores a balanced
            bar; from sm the group shrink-wraps and the parent pushes it right
            again, opposite the name. */}
        <div className="flex w-full items-center justify-center gap-4 sm:w-auto sm:gap-6">
          <ul className="flex items-center gap-4 font-mono text-[0.7rem] uppercase tracking-[0.14em] sm:gap-6">
            {SECTIONS.map(({ id, label }) => (
              <li key={id}>
                <Link
                  href={isHome ? `#${id}` : `/#${id}`}
                  onClick={isHome ? (e) => handleNavClick(e, id) : undefined}
                  className={cn(
                    "transition-colors",
                    isHome && active === id
                      ? "font-semibold text-accent"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/blog"
                className={cn(
                  "transition-colors",
                  isBlog
                    ? "font-semibold text-accent"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Blog
              </Link>
            </li>
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
