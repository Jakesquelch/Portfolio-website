import fs from "node:fs";
import path from "node:path";
import type { ComponentType } from "react";

/**
 * Blog post index. Posts are `.mdx` files in `content/posts/`, one per
 * article, each exporting a `meta` block:
 *
 *   export const meta = {
 *     title: "…",
 *     date: "2026-09-01",
 *     summary: "…",
 *     tags: ["C++"],
 *   };
 *
 * The filename is the slug, so `content/posts/hello-world.mdx` is served at
 * `/blog/hello-world`. There's no separate index to keep in sync — dropping a
 * file in the directory is the whole publishing step.
 *
 * Everything here is server-only (`node:fs`) and runs at build time: the
 * listing and every post are prerendered as static HTML.
 */

export type PostMeta = {
  /** Headline, used for the card, the <h1> and the page <title>. */
  title: string;
  /** ISO `YYYY-MM-DD`. Sorted on as a plain string, so keep the format. */
  date: string;
  /** One-line hook shown on the listing card and as the meta description. */
  summary: string;
  tags?: readonly string[];
};

/** A post's metadata plus the slug derived from its filename. */
export type Post = PostMeta & { slug: string };

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/** Slugs of every post, unordered. Backs `generateStaticParams`. */
export function getPostSlugs(): string[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/** A compiled post module: the rendered body plus its `meta` export. */
export type PostModule = { Body: ComponentType; meta: PostMeta };

/**
 * Load one post, or null if the slug doesn't resolve. The import is dynamic so
 * the bundler builds a lookup over the posts directory rather than needing
 * each file listed by hand; the static `@/content/posts/` prefix and the
 * literal `.mdx` extension are both required for it to do that.
 *
 * A template-literal import is typed `any`, so the shape is asserted here —
 * once, rather than at each call site. It's the one place the `meta` contract
 * in a post file meets the type system.
 */
export async function getPost(slug: string): Promise<PostModule | null> {
  try {
    const { default: Body, meta } = (await import(
      `@/content/posts/${slug}.mdx`
    )) as { default: ComponentType; meta: PostMeta };
    return { Body, meta };
  } catch {
    return null;
  }
}

/** Just the `meta` block of one post — for listings and metadata. */
export async function getPostMeta(slug: string): Promise<PostMeta | null> {
  return (await getPost(slug))?.meta ?? null;
}

/** Every post, newest first — the order the listing page renders. */
export async function getAllPosts(): Promise<Post[]> {
  const posts = await Promise.all(
    getPostSlugs().map(async (slug) => {
      const meta = await getPostMeta(slug);
      return meta ? { slug, ...meta } : null;
    }),
  );

  return posts
    .filter((post) => post !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * "1 September 2026". Locale is pinned to en-GB rather than left to the
 * runtime: these render at build time on a server whose locale is nobody's
 * business, and a drifting format would show up as a hydration mismatch.
 */
export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
