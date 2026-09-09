import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getPostSlugs, getPost, getPostMeta, formatPostDate } from "@/lib/posts";

/**
 * A single post. The body is the compiled MDX file; everything around it —
 * title, date, tags — comes from that file's `meta` export, so a post is
 * authored entirely in `content/posts/<slug>.mdx`.
 */

/**
 * Every post is prerendered at build time. `dynamicParams = false` means a
 * slug that isn't in the list 404s instead of being rendered on demand, which
 * is what we want: there is no post source outside the repo.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getPostMeta(slug);
  if (!meta) return {};

  return {
    // Feeds the "%s | Jake Squelch" template set in app/layout.tsx.
    title: meta.title,
    description: meta.summary,
    openGraph: {
      title: meta.title,
      description: meta.summary,
      type: "article",
      publishedTime: meta.date,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.summary,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  // `dynamicParams = false` means an unknown slug 404s before reaching this,
  // so the guard is really just narrowing the type.
  if (!post) notFound();
  const { Body, meta } = post;

  return (
    <main className="flex flex-1 flex-col">
      <article className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl lg:max-w-4xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All posts
          </Link>

          <header className="mt-6 border-b border-line pb-6">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {meta.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <time
                dateTime={meta.date}
                className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground"
              >
                {formatPostDate(meta.date)}
              </time>
              {meta.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {/* Element styling for everything inside comes from the root
              mdx-components.tsx, not from a wrapper class. */}
          <div className="mt-2">
            <Body />
          </div>
        </div>
      </article>
    </main>
  );
}
