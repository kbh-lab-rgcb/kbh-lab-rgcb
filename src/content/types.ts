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
  /** The `NN-` prefix from the filename; orders this against the stories. */
  order: number;
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

/**
 * A research story: one `.txt` file in a page's `stories/` folder.
 *
 * A longer, publication-grounded piece than a `Section` — it carries a kicker,
 * a standfirst, a "why it matters" line and the papers it is built on. Every
 * one of those is optional and renders only when supplied, so a story file with
 * nothing but a body still produces a correct block.
 */
export type Story = {
  slug: string;
  /** The `NN-` prefix from the filename; orders this against the sections. */
  order: number;
  title: string;
  /** Kicker above the heading, from `tag:`. */
  tag: string;
  /** One-sentence standfirst under the heading, from `lead:`. */
  lead: string;
  /** The "why it matters" callout, from `why:`. */
  why: string;
  /** Short card copy for the home page, from `excerpt:`. */
  excerpt: string;
  /** DOIs of the papers behind the story, in the order written. */
  paperDois: string[];
  /**
   * Those DOIs looked up on the publications page, so a story's citations can
   * never drift from the list of papers itself. A DOI that is not listed there
   * still yields an entry — a bare DOI and its link — plus a build warning.
   */
  papers: Publication[];
  /** `home: no` keeps a story off the home page. Everything else is on. */
  onHome: boolean;
  html: string;
  text: string;
  figure: Img | null;
  caption: string;
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

/** One line of a roster: a person and where they came from. */
export type RosterEntry = {
  name: string;
  /** College or institution. Empty when the editor gave only a name. */
  affiliation: string;
};

/**
 * A plain list of people who pass through the lab in numbers too large for a
 * card each — visiting trainees, MSc project students. Rendered collapsed.
 */
export type Roster = {
  title: string;
  entries: RosterEntry[];
};

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
  /** Research stories from `stories/`, merged with `sections` by `order`. */
  stories: Story[];
  members: Member[];
  publicationYears: PublicationYear[];
  links: LinkItem[];
  gallery: GalleryItem[];
  /** Collapsible name lists from `lists/`, shown below the cards. */
  rosters: Roster[];
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
