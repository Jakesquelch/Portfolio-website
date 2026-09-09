import { ImageResponse } from "next/og";
import { getPostSlugs, getPostMeta, formatPostDate } from "@/lib/posts";

/**
 * Per-post OpenGraph card. Same construction as the site-wide one in
 * `app/opengraph-image.tsx` — white ground, violet rule, mono eyebrow — but
 * carrying the post's own title so a shared link previews as the article
 * rather than as the homepage.
 *
 * Colocated with the post route, so it's picked up automatically — nothing
 * references it from metadata. It compiles to its own route rather than
 * inheriting the page's, hence the second `generateStaticParams` below:
 * without it every card would be rendered on demand instead of at build time.
 *
 * Satori's CSS support is limited: every flex container needs an explicit
 * `display: flex` and colours are plain hex.
 */

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Blog post by Jake Squelch";

export default async function PostOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = await getPostMeta(slug);
  const title = meta?.title ?? "Blog";

  // Long headlines would otherwise overrun the card — step the size down
  // rather than clipping or wrapping to four cramped lines.
  const titleSize = title.length > 60 ? 68 : title.length > 34 ? 88 : 110;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 100px",
          background: "#ffffff",
          color: "#1c1c1e",
          fontFamily: "ui-sans-serif",
          borderBottom: "14px solid #6d28d9",
        }}
      >
        <div
          style={{
            fontSize: 30,
            color: "#6d28d9",
            display: "flex",
            marginBottom: 24,
            fontFamily: "ui-monospace, monospace",
            letterSpacing: "0.24em",
          }}
        >
          BLOG
        </div>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            color: "#1c1c1e",
            display: "flex",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#6a6a70",
            display: "flex",
            marginTop: 32,
          }}
        >
          {meta ? `Jake Squelch · ${formatPostDate(meta.date)}` : "Jake Squelch"}
        </div>
      </div>
    ),
    size,
  );
}
