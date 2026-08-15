/**
 * Every URL the site emits is relative to the page that contains it.
 *
 * This is what lets the same `docs/` output work at `user.github.io/CRP7/`,
 * on a custom domain, and opened straight from disk — with no base path to
 * configure and get wrong. `depth` is how many directories deep the page being
 * rendered sits: 0 for the home page, 1 for `research/index.html`, and so on.
 */

import type { Page } from "../content/types.ts";

/** Resolve a site-root-relative path against a page at `depth`. */
export function rel(depth: number, path: string): string {
  const prefix = depth === 0 ? "./" : "../".repeat(depth);
  const clean = path.replace(/^\/+/, "");
  return clean ? `${prefix}${clean}` : prefix;
}

/** How deep a page's `index.html` sits below the site root. */
export function depthOf(page: Page): number {
  return page.outDir ? page.outDir.split("/").filter(Boolean).length : 0;
}

/** Link to a page from a page at `depth`. */
export function hrefTo(depth: number, target: Page): string {
  return target.outDir ? rel(depth, `${target.outDir}/`) : rel(depth, "");
}

/** Where a page's HTML file is written, relative to the output root. */
export function outputPath(page: Page): string {
  return page.outDir ? `${page.outDir}/index.html` : "index.html";
}
