import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllPosts, formatPostDate } from "@/lib/posts";
import { SectionLabel } from "@/components/section-label";

/**
 * Blog index — every post as a card, newest first, driven by whatever `.mdx`
 * files are in `content/posts/`. Server component, prerendered at build time.
 *
 * Unlike the homepage this is a real route rather than an anchor section, so
 * the nav treats it separately (see components/nav.tsx).
 */

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on software engineering, C++, and whatever I'm currently working through.",
};

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    // `flex-1` so the footer sits at the bottom of the viewport rather than
    // floating mid-screen while there are only a couple of posts.
    <main className="flex flex-1 flex-col">
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl lg:max-w-4xl">
          <SectionLabel>Blog</SectionLabel>

          {posts.length === 0 ? (
            <p className="text-base/relaxed text-muted-foreground">
              Nothing published yet — check back soon.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group rounded-xl border border-line bg-surface transition-colors hover:border-foreground/20"
                >
                  {/* The whole card is the link target — a small card with a
                      separate "read more" affordance would be more chrome
                      than content. */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex flex-col gap-3 p-6 md:p-7"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <time
                        dateTime={post.date}
                        className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        {formatPostDate(post.date)}
                      </time>
                      {post.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-xl font-semibold tracking-tight">
                      {post.title}
                    </h3>

                    <p className="text-sm/relaxed text-muted-foreground md:text-base/relaxed">
                      {post.summary}
                    </p>

                    <span className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-accent">
                      Read post
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
