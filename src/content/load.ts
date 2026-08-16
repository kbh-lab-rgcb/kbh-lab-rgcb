/**
 * Walks `content/` and produces the typed site model.
 *
 * The contract this file exists to keep: **loading never throws**. A missing
 * file, an empty folder, a photo with no matching text, a corrupt image — each
 * becomes a `Warning` plus a sensible fallback, and the site still builds. The
 * people editing this content do so in a browser and cannot debug a failed CI
 * run, so a degraded page always beats a red X.
 */

import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { createImagePipeline, listImages } from "./images.ts";
import {
  excerpt,
  field,
  flag,
  initialsOf,
  parseCitation,
  parseDoc,
  parseName,
  plainText,
  profileLinks,
  renderMarkdown,
  boldAuthors,
  titleFromSlug,
} from "./text.ts";
import type {
  GalleryItem,
  Img,
  LinkItem,
  Member,
  Page,
  PageKind,
  Publication,
  PublicationYear,
  Section,
  Site,
  SiteConfig,
  Warning,
} from "./types.ts";

const TEXT_EXTENSIONS = [".txt", ".md", ".markdown"];

/** Folder-name patterns that select a page renderer. Order matters. */
const KIND_RULES: [RegExp, PageKind][] = [
  [/^(home|index|welcome|profile)$/, "home"],
  [/(team|people|members|group)/, "team"],
  [/alumni|former/, "alumni"],
  [/publication|papers/, "publications"],
  [/gallery|photos|album/, "gallery"],
  [/contact|reach|find-us/, "contact"],
  [/link|resource|outreach|elsewhere/, "links"],
];

function kindFor(slug: string): PageKind {
  for (const [pattern, kind] of KIND_RULES) {
    if (pattern.test(slug)) return kind;
  }
  // Anything unrecognised renders as prose sections with optional figures,
  // so adding `09-facilities/` gives a working page with no code change.
  return "research";
}

async function listTextFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          TEXT_EXTENSIONS.includes(extname(entry.name).toLowerCase()) &&
          !entry.name.startsWith(".") &&
          entry.name.toLowerCase() !== "readme.md",
      )
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  } catch {
    return [];
  }
}

async function listDirs(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  } catch {
    return [];
  }
}

async function readIfPresent(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

const DEFAULT_CONFIG: SiteConfig = {
  name: "Research Lab",
  shortName: "Lab",
  tagline: "",
  description: "",
  pi: { name: "", title: "", email: "" },
  institute: "",
  address: [],
  phones: [],
  emails: [],
  labAuthors: [],
  footerNote: "",
};

async function loadConfig(contentDir: string, warnings: Warning[]): Promise<SiteConfig> {
  const path = join(contentDir, "site.json");
  const raw = await readIfPresent(path);
  if (!raw) {
    warnings.push({
      file: "content/site.json",
      message: "Site settings file is missing.",
      fallback: "Placeholder lab details were used.",
    });
    return DEFAULT_CONFIG;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      pi: { ...DEFAULT_CONFIG.pi, ...(parsed.pi ?? {}) },
      address: parsed.address ?? [],
      phones: parsed.phones ?? [],
      emails: parsed.emails ?? [],
      labAuthors: parsed.labAuthors ?? [],
    };
  } catch (error) {
    warnings.push({
      file: "content/site.json",
      message: `Site settings file is not valid JSON (${(error as Error).message}).`,
      fallback: "Placeholder lab details were used. Check for a missing comma or quote.",
    });
    return DEFAULT_CONFIG;
  }
}

/* ------------------------------------------------------------------ *
 * Loaders for each kind of folder
 * ------------------------------------------------------------------ */

type Ctx = {
  pageDir: string;
  relDir: string;
  slug: string;
  images: Awaited<ReturnType<typeof createImagePipeline>>;
  warnings: Warning[];
};

/**
 * Below this, a banner is visibly soft.
 *
 * A banner is stretched the full width of the window, so it is the one place on
 * the site where a small image cannot hide. The usual culprit is a picture
 * pasted into Word or PowerPoint and exported as SVG: the result is a thumbnail
 * wrapped in a vector shell, and no amount of CSS can put the detail back.
 */
const BANNER_MIN_WIDTH = 1200;

/**
 * Spots a photo that was pasted into Word or PowerPoint and exported as SVG.
 *
 * That export is not a vector drawing. It is a small bitmap wrapped in an SVG
 * shell and blown up by a `transform`, so it looks right in the editor and
 * turns to mush the moment it is stretched across a banner. Its declared size
 * is no help either — the shell claims whatever the slide was, and the file
 * reports as 1600x900 while the actual picture inside it is 32 pixels wide.
 * Reading the markup is the only way to see the difference.
 *
 * @returns the embedded bitmap's width, or null if this is a real vector file.
 */
function embeddedBitmapWidth(svg: string): number | null {
  const tag = svg.match(/<image\b[^>]*>/i)?.[0];
  if (!tag || !/href="data:image\//i.test(tag)) return null;
  const width = Number(tag.match(/\bwidth="(\d+)"/i)?.[1]);
  return Number.isFinite(width) && width > 0 ? width : null;
}

async function loadBanners(ctx: Ctx): Promise<Img[]> {
  const dir = join(ctx.pageDir, "banner");
  const files = await listImages(dir);
  const banners: Img[] = [];

  for (const file of files) {
    const path = join(dir, file);
    const image = await ctx.images.process(path, `${ctx.slug}`, "");
    if (!image) continue;

    // Published either way — a soft banner is still a banner. The editor just
    // gets told why it looks the way it does, and what to do about it.
    const advice =
      `Save the original photo as a .jpg at least ${BANNER_MIN_WIDTH}px wide and ` +
      `put that in the banner folder instead.`;

    if (extname(file).toLowerCase() === ".svg") {
      const raw = await readFile(path, "utf8").catch(() => "");
      const bitmap = embeddedBitmapWidth(raw);
      if (bitmap !== null && bitmap < BANNER_MIN_WIDTH) {
        ctx.warnings.push({
          file: `${ctx.relDir}/banner/${file}`,
          message:
            `This looks like a photo exported to SVG from Word or PowerPoint: the ` +
            `picture inside it is only ${bitmap} pixels wide, however large the file claims to be.`,
          fallback: `It is on the site, but the banner will look blurry. ${advice}`,
        });
      }
    } else if (image.width > 0 && image.width < BANNER_MIN_WIDTH) {
      ctx.warnings.push({
        file: `${ctx.relDir}/banner/${file}`,
        message: `This banner image is only ${image.width}×${image.height} pixels.`,
        fallback: `It is on the site, but stretched across the banner it will look blurry. ${advice}`,
      });
    }

    banners.push(image);
  }

  return banners;
}

async function loadSections(ctx: Ctx): Promise<Section[]> {
  const textDir = join(ctx.pageDir, "text");
  const figuresDir = join(ctx.pageDir, "figures");
  const files = await listTextFiles(textDir);
  const figures = await listImages(figuresDir);

  const figureBySlug = new Map<string, string>();
  for (const file of figures) figureBySlug.set(parseName(file).slug, file);

  // Files already arrive in numeric-aware alphabetical order, so the `NN-`
  // prefix orders sections without any extra sorting here.
  const sections: Section[] = [];
  for (const file of files) {
    const { slug } = parseName(file);
    const raw = (await readIfPresent(join(textDir, file))) ?? "";
    const { fields, body } = parseDoc(raw);

    if (!body.trim() && !field(fields, "title")) {
      ctx.warnings.push({
        file: `${ctx.relDir}/text/${file}`,
        message: "This text file is empty.",
        fallback: "A heading was shown using the file name.",
      });
    }

    const figureFile = figureBySlug.get(slug);
    const figure = figureFile
      ? await ctx.images.process(
          join(figuresDir, figureFile),
          `${ctx.slug}`,
          field(fields, "caption", "alt") || field(fields, "title") || titleFromSlug(slug),
        )
      : null;

    sections.push({
      slug,
      title: field(fields, "title", "heading") || titleFromSlug(slug),
      html: renderMarkdown(body),
      text: plainText(body),
      figure,
      caption: field(fields, "caption"),
      fields,
    });
  }
  return sections;
}

/**
 * Load people from paired `photos/` and `text/` folders.
 *
 * The slug set is the **union** of both folders, which is the crux of the whole
 * design: a photo with no text still produces a card (name from the filename),
 * and text with no photo produces a card with an initials avatar. Neither is an
 * error, because both are normal intermediate states when two people are each
 * adding half of an entry.
 */
async function loadMembers(ctx: Ctx, isAlumni: boolean): Promise<Member[]> {
  const photosDir = join(ctx.pageDir, "photos");
  const textDir = join(ctx.pageDir, "text");
  const photoFiles = await listImages(photosDir);
  const textFiles = await listTextFiles(textDir);

  type Entry = { order: number; photo?: string; text?: string };
  const entries = new Map<string, Entry>();

  const upsert = (slug: string, order: number, patch: Partial<Entry>) => {
    const existing = entries.get(slug) ?? { order };
    entries.set(slug, { ...existing, ...patch, order: Math.min(existing.order, order) });
  };

  for (const file of photoFiles) {
    const { order, slug } = parseName(file);
    upsert(slug, order, { photo: file });
  }
  for (const file of textFiles) {
    const { order, slug } = parseName(file);
    upsert(slug, order, { text: file });
  }

  const sorted = [...entries.entries()].sort(
    ([aSlug, a], [bSlug, b]) => a.order - b.order || aSlug.localeCompare(bSlug),
  );

  const members: Member[] = [];
  for (const [slug, entry] of sorted) {
    const raw = entry.text ? ((await readIfPresent(join(textDir, entry.text))) ?? "") : "";
    const { fields, body } = parseDoc(raw);

    if (!entry.text) {
      ctx.warnings.push({
        file: `${ctx.relDir}/photos/${entry.photo}`,
        message: "This photo has no matching text file.",
        fallback: `The name was taken from the file name. Add ${ctx.relDir}/text/${slug}.txt for a role and biography.`,
      });
    }

    const name = field(fields, "name") || titleFromSlug(slug);
    const photo = entry.photo
      ? await ctx.images.process(
          join(photosDir, entry.photo),
          ctx.slug,
          name,
        )
      : null;

    if (!photo && entry.text) {
      ctx.warnings.push({
        file: `${ctx.relDir}/text/${entry.text}`,
        message: "This person has no photo.",
        fallback: `Their initials are shown instead. Add ${ctx.relDir}/photos/${slug}.jpg for a portrait.`,
      });
    }

    members.push({
      slug,
      name,
      role: field(fields, "role", "designation", "position") || (isAlumni ? "Alumnus" : "Lab member"),
      email: field(fields, "email"),
      focus: field(fields, "focus", "research", "topic", "project"),
      year: field(fields, "year", "graduated"),
      thesis: field(fields, "thesis", "title"),
      now: field(fields, "now", "current", "currentposition", "placement"),
      html: renderMarkdown(body),
      text: plainText(body),
      photo,
      initials: initialsOf(name),
      links: profileLinks(fields),
      fields,
    });
  }
  return members;
}

async function loadPublications(ctx: Ctx, labAuthors: string[]): Promise<PublicationYear[]> {
  // `years/` is the documented home, but tolerate files sitting directly in the
  // page folder too — an editor who drops `2025.txt` one level up still works.
  const yearsDir = existsSync(join(ctx.pageDir, "years"))
    ? join(ctx.pageDir, "years")
    : ctx.pageDir;
  const files = (await listTextFiles(yearsDir)).filter((file) => /\d{4}/.test(file));

  const groups: PublicationYear[] = [];
  for (const file of files) {
    const year = /(\d{4})/.exec(basename(file))?.[1] ?? "";
    const raw = (await readIfPresent(join(yearsDir, file))) ?? "";
    const items: Publication[] = [];

    // Entries are separated by blank lines so a long citation may wrap across
    // several lines — which is what happens when someone pastes from a PDF.
    for (const block of raw.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
      const line = block.replace(/\n/g, " ").trim();
      if (!line || line.startsWith("#")) continue;
      const { citation, links } = parseCitation(line);
      if (!citation) continue;
      items.push({ year, citation, html: boldAuthors(citation, labAuthors), links });
    }

    if (items.length === 0) {
      ctx.warnings.push({
        file: `${ctx.relDir}/years/${file}`,
        message: "No publications were found in this file.",
        fallback: "The year was left out. Put one citation per paragraph.",
      });
      continue;
    }
    groups.push({ year, items });
  }

  return groups.sort((a, b) => b.year.localeCompare(a.year));
}

async function loadLinks(ctx: Ctx): Promise<LinkItem[]> {
  const dir = existsSync(join(ctx.pageDir, "links")) ? join(ctx.pageDir, "links") : ctx.pageDir;
  const files = await listTextFiles(dir);
  const links: LinkItem[] = [];

  for (const file of files) {
    const { slug } = parseName(file);
    const raw = (await readIfPresent(join(dir, file))) ?? "";
    const { fields, body } = parseDoc(raw);
    const url = field(fields, "url", "link", "href");

    if (!url) {
      ctx.warnings.push({
        file: `${ctx.relDir}/links/${file}`,
        message: "This link has no web address.",
        fallback: "It was left out. Add a line such as `url: https://rgcb.res.in/...`.",
      });
      continue;
    }

    links.push({
      slug,
      title: field(fields, "title", "name") || titleFromSlug(slug),
      url,
      description: field(fields, "description", "summary") || excerpt(body, 160),
      featured: flag(field(fields, "featured", "front", "home")),
    });
  }
  return links;
}

async function loadGallery(ctx: Ctx): Promise<GalleryItem[]> {
  const photosDir = join(ctx.pageDir, "photos");
  const textDir = join(ctx.pageDir, "text");
  const photoFiles = await listImages(photosDir);
  const textFiles = await listTextFiles(textDir);

  const textBySlug = new Map<string, string>();
  for (const file of textFiles) textBySlug.set(parseName(file).slug, file);

  const items: GalleryItem[] = [];
  for (const file of photoFiles) {
    const { slug } = parseName(file);
    // Captions are genuinely optional here — requiring a text file per photo
    // would make uploading an album unbearable.
    const textFile = textBySlug.get(slug);
    const raw = textFile ? ((await readIfPresent(join(textDir, textFile))) ?? "") : "";
    const { fields, body } = parseDoc(raw);
    const title = field(fields, "title", "caption") || titleFromSlug(slug);
    const photo = await ctx.images.process(join(photosDir, file), `${ctx.slug}`, title);
    if (!photo) continue;
    items.push({ slug, title, caption: field(fields, "caption") || plainText(body), photo });
  }
  return items;
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

export async function loadSite(options: {
  contentDir: string;
  outRoot: string;
  cacheRoot: string;
}): Promise<Site> {
  const warnings: Warning[] = [];
  const config = await loadConfig(options.contentDir, warnings);
  const images = await createImagePipeline({
    outRoot: options.outRoot,
    cacheRoot: options.cacheRoot,
  });
  warnings.push(...images.warnings);

  const pagesRoot = join(options.contentDir, "pages");
  const folders = await listDirs(pagesRoot);

  if (folders.length === 0) {
    warnings.push({
      file: "content/pages",
      message: "No page folders were found.",
      fallback: "An empty site was produced.",
    });
  }

  const pages: Page[] = [];
  for (const folder of folders) {
    const { order, slug } = parseName(folder);
    const pageDir = join(pagesRoot, folder);
    const relDir = `content/pages/${folder}`;
    const kind = kindFor(slug);

    const meta = parseDoc((await readIfPresent(join(pageDir, "page.txt"))) ?? "");
    const ctx: Ctx = { pageDir, relDir, slug, images, warnings };

    // On these pages `text/` pairs with `photos/` — the files in it are people
    // or captions, not prose sections. Loading them as both would print every
    // biography twice, so the page's own intro comes from `page.txt` instead.
    const textFolderIsPaired = kind === "team" || kind === "alumni" || kind === "gallery";

    const page: Page = {
      slug,
      title: field(meta.fields, "title", "nav", "name") || titleFromSlug(slug),
      tagline: field(meta.fields, "tagline", "subtitle", "summary"),
      introHtml: renderMarkdown(meta.body),
      kind,
      order: Number.isFinite(order) ? order : 500 + pages.length,
      outDir: kind === "home" ? "" : slug,
      banners: await loadBanners(ctx),
      sections: textFolderIsPaired ? [] : await loadSections(ctx),
      members:
        kind === "team" || kind === "alumni" ? await loadMembers(ctx, kind === "alumni") : [],
      publicationYears:
        kind === "publications" ? await loadPublications(ctx, config.labAuthors) : [],
      links: kind === "links" ? await loadLinks(ctx) : [],
      gallery: kind === "gallery" ? await loadGallery(ctx) : [],
      fields: meta.fields,
    };

    pages.push(page);
  }

  pages.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

  // The home page must exist and must be first, otherwise the site has no
  // index.html and every relative link is computed against the wrong depth.
  const homeIndex = pages.findIndex((page) => page.kind === "home");
  if (homeIndex > 0) pages.unshift(...pages.splice(homeIndex, 1));
  if (homeIndex === -1 && pages[0]) {
    pages[0].kind = "home";
    pages[0].outDir = "";
    warnings.push({
      file: "content/pages",
      message: "No home page folder was found.",
      fallback: `"${pages[0].title}" is being used as the home page.`,
    });
  }

  return { config, pages, warnings };
}
