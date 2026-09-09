import type { MDXComponents } from "mdx/types";
import { cn } from "@/lib/utils";

/**
 * Global MDX element styling. Markdown compiles to plain HTML tags, so this
 * maps those tags onto the site's type scale and colour tokens — a post ends
 * up reading like the rest of the page without pulling in a prose plugin.
 *
 * Required at the project root by `@next/mdx`: the App Router will not compile
 * MDX at all without this file. The `useMDXComponents` signature takes no
 * arguments in this version of Next.
 *
 * Vertical rhythm lives on the elements themselves rather than on a wrapper,
 * so headings can carry more space above than below.
 *
 * Every mapping merges an incoming `className` rather than spreading props
 * over the top of it: MDX sets one itself on fenced code (`language-tsx`), and
 * a plain `{...props}` after `className=` would silently drop all the styling
 * below.
 */
const components: MDXComponents = {
  // h1 is rendered by the post page from `meta.title`, so a `#` heading inside
  // a post is a mistake — style it as an h2 rather than competing with it.
  h1: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-10 mb-3 text-xl font-semibold tracking-tight md:text-2xl",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-10 mb-3 text-xl font-semibold tracking-tight md:text-2xl",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-8 mb-2 text-lg font-semibold tracking-tight md:text-xl",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn(
        "my-4 text-base/relaxed text-foreground/90 md:text-lg/relaxed",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "my-4 list-disc space-y-1.5 pl-5 text-base/relaxed text-foreground/90 marker:text-muted-foreground md:text-lg/relaxed",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "my-4 list-decimal space-y-1.5 pl-5 text-base/relaxed text-foreground/90 marker:text-muted-foreground md:text-lg/relaxed",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-6 border-l-2 border-accent pl-4 text-base/relaxed text-muted-foreground italic md:text-lg/relaxed",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-10 border-line", className)} {...props} />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold", className)} {...props} />
  ),

  /**
   * Links matching the site's convention: external ones open in a new tab.
   * Anything not starting with `http` is treated as internal (`/blog/…`,
   * `/#projects`) and left to normal navigation.
   */
  a: ({ href, className, ...props }) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
        className={cn(
          "text-accent underline underline-offset-2 transition-colors hover:text-foreground",
          className,
        )}
        {...props}
      />
    );
  },

  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[0.85em]",
        className,
      )}
      {...props}
    />
  ),

  /**
   * Fenced code blocks. Markdown nests a `<code>` inside every `<pre>`, which
   * would otherwise pick up the inline-code chrome above and draw a second
   * border and background inside the first — the `[&_code]` overrides strip it
   * back off. They're descendant selectors, so they outrank the utilities
   * sitting directly on that `<code>`.
   */
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-6 overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-sm/relaxed",
        "[&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit",
        className,
      )}
      {...props}
    />
  ),

  // Markdown image syntax carries no dimensions, so next/image can't be used
  // here without every post hard-coding width/height in JSX instead.
  img: ({ className, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cn("my-6 w-full rounded-xl border border-line", className)}
      alt=""
      {...props}
    />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
