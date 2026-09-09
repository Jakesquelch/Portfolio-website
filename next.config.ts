import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the on-screen route-status indicator that appears bottom-left in dev.
  // Next.js will still surface build / runtime errors as usual.
  devIndicators: false,
};

/**
 * MDX support for the blog. Posts live in `content/posts/*.mdx` and are
 * imported by `app/blog/[slug]/page.tsx` — they aren't routes themselves, so
 * `pageExtensions` deliberately stays untouched (adding "mdx" there would
 * make any stray .mdx file under `app/` become a page).
 *
 * Remark/rehype plugins, if ever added, must be named as strings rather than
 * imported functions — Turbopack (the default builder) can't pass JS
 * functions across to its Rust core.
 */
const withMDX = createMDX({});

export default withMDX(nextConfig);
