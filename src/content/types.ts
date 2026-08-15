/**
 * The shape of everything under `content/`.
 *
 * Guiding rule for this whole module: content is written by lab members through
 * GitHub's web UI, so every field that can be absent IS absent-able. Nothing here
 * throws; unusable input becomes a `Warning` and a sensible fallback.
 */

/** A profile link that only renders when the editor actually supplied it. */
export type ProfileLink = {
  /** Key as written in the text file, e.g. `orcid`. */
  kind: string;
  /** Human label for the link, e.g. `ORCID`. */
  label: string;
  /** Fully-resolved absolute URL. */
  url: string;
};

/** An image discovered on disk, plus the responsive variants generated for it. */
export type Img = {
  /** Path relative to the site root, e.g. `assets/team/arun-v.jpg`. */
  src: string;
  width: number;
  height: number;
  /** `srcset` value; empty when only one size was produced. */
  srcset: string;
  /** Best-guess alt text; callers usually override with something specific. */
  alt: string;
};

/** A prose block: one `.txt`/`.md` file in a page's `text/` folder. */
export type Section = {
  slug: string;
  title: string;
  /** Rendered HTML of the body. */
  html: string;
  /** Plain-text body, used for meta descriptions and excerpts. */
  text: string;
  /** Paired image from the page's `figures/` folder, if one exists. */
  figure: Img | null;
  /** Caption for the figure, from a `caption:` key. */
  caption: string;
  /** Every `key: value` from the header, including ones we do not use. */
  fields: Record<string, string>;
};

/** A person on the Team or Alumni page. */
export type Member = {
  slug: string;
  name: string;
  role: string;
  email: string;
  /** One-line research focus, shown under the role. */
  focus: string;
  /** Alumni only: year they finished. */
  year: string;
  /** Alumni only: thesis title. */
  thesis: string;
  /** Alumni only: where they are now. */
  now: string;
  html: string;
  text: string;
  photo: Img | null;
  /** Initials used for the fallback avatar when `photo` is null. */
  initials: string;
  /** Only the profile links the editor actually provided. */
  links: ProfileLink[];
  fields: Record<string, string>;
};

/** One paper. `links` is empty when no identifier was supplied. */
export type Publication = {
  year: string;
  /** The citation with any trailing identifiers stripped off. */
  citation: string;
  /** Citation HTML with lab-member surnames bolded. */
  html: string;
  links: ProfileLink[];
};

export type PublicationYear = {
  year: string;
  items: Publication[];
};

/** An outgoing link (RGCB pages, training, consultancy). */
export type LinkItem = {
  slug: string;
  title: string;
  url: string;
  description: string;
  /** `featured: yes` also surfaces this on the home page. */
  featured: boolean;
};

/** One gallery photo; caption is optional. */
export type GalleryItem = {
  slug: string;
  title: string;
  caption: string;
  photo: Img;
};

/** What kind of content a page folder holds, inferred from its name. */
export type PageKind =
  | "home"
  | "research"
  | "team"
  | "alumni"
  | "publications"
  | "gallery"
  | "contact"
  | "links";

export type Page = {
  /** URL slug with the ordering prefix removed, e.g. `research`. */
  slug: string;
  /** Nav label, from `page.txt` `title:` or derived from the folder name. */
  title: string;
  /** Short line rendered under the page title in the banner. */
  tagline: string;
  /** Rendered body of `page.txt`, shown above the page's main content. */
  introHtml: string;
  kind: PageKind;
  order: number;
  /** Output path relative to the site root; `""` for the home page. */
  outDir: string;
  /** Images in `banner/`. 0 = gradient, 1 = static banner, 2+ = carousel. */
  banners: Img[];
  sections: Section[];
  members: Member[];
  publicationYears: PublicationYear[];
  links: LinkItem[];
  gallery: GalleryItem[];
  fields: Record<string, string>;
};

export type SiteConfig = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  pi: { name: string; title: string; email: string };
  institute: string;
  address: string[];
  phones: { label: string; value: string }[];
  emails: { label: string; value: string }[];
  /** Surnames auto-bolded in citations. */
  labAuthors: string[];
  footerNote: string;
};

export type Warning = {
  /** Path relative to the repo root, so the message points at a real file. */
  file: string;
  message: string;
  /** What the build did instead. */
  fallback: string;
};

export type Site = {
  config: SiteConfig;
  pages: Page[];
  warnings: Warning[];
};
