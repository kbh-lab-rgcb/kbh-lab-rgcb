/**
 * Content report: `npm run check`.
 *
 * Tells an editor what the site currently sees in `content/` and what it could
 * not use, without publishing anything. Always exits 0 — nothing in `content/`
 * is ever an error.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rm } from "node:fs/promises";
import { loadSite } from "../src/content/load.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = join(root, ".cache", "check-output");

const site = await loadSite({
  contentDir: join(root, "content"),
  outRoot: scratch,
  cacheRoot: join(root, ".cache"),
});

console.log(`\n${site.config.name}\n`);

for (const page of site.pages) {
  console.log(`  ${page.title}  (content/pages/…-${page.slug}/, shown as “${page.kind}”)`);
  const bits = [
    `${page.banners.length} banner image(s)${page.banners.length > 1 ? " — carousel" : ""}`,
    page.sections.length ? `${page.sections.length} text section(s)` : "",
    page.stories.length ? `${page.stories.length} research story/stories` : "",
    page.members.length ? `${page.members.length} people` : "",
    page.publicationYears.length
      ? `${page.publicationYears.reduce((total, year) => total + year.items.length, 0)} papers across ${page.publicationYears.length} years`
      : "",
    page.gallery.length ? `${page.gallery.length} photos` : "",
    page.links.length ? `${page.links.length} links` : "",
  ].filter(Boolean);
  for (const bit of bits) console.log(`      ${bit}`);
}

if (site.warnings.length === 0) {
  console.log("\nNo problems found.\n");
} else {
  console.log(`\n${site.warnings.length} thing(s) to look at:\n`);
  for (const warning of site.warnings) {
    console.log(`  ${warning.file}`);
    console.log(`    ${warning.message}`);
    console.log(`    → ${warning.fallback}\n`);
  }
}

await rm(scratch, { recursive: true, force: true });
