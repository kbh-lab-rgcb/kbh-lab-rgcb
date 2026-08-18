/** Builds the site into `docs/`. Run with `npm run build`. */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildSite, reportWarnings } from "../src/build.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const result = await buildSite({ root });

console.log(
  `Built ${result.pageCount} page${result.pageCount === 1 ? "" : "s"}` +
    (result.profileCount > 0 ? ` and ${result.profileCount} personal profile(s)` : "") +
    ` into docs/ in ${result.ms}ms`,
);
for (const page of result.site.pages) {
  const counts = [
    page.sections.length && `${page.sections.length} section(s)`,
    page.stories.length && `${page.stories.length} story/stories`,
    page.members.length && `${page.members.length} people`,
    page.publicationYears.length &&
      `${page.publicationYears.reduce((total, year) => total + year.items.length, 0)} papers`,
    page.gallery.length && `${page.gallery.length} photos`,
    page.albums.length &&
      `${page.albums.length} album(s) holding ${page.albums.reduce((total, album) => total + album.items.length, 0)} photos`,
    page.links.length && `${page.links.length} links`,
    page.banners.length && `${page.banners.length} banner image(s)`,
  ].filter(Boolean);
  console.log(`  ${page.outDir || "/"} — ${counts.join(", ") || "empty"}`);
}

reportWarnings(result.warnings);
