/**
 * Reusable markup fragments.
 *
 * Every one of these takes `depth` so image and link URLs come out relative to
 * the page being rendered. See `url.ts` for why.
 */

import { attr, cls, esc, join } from "../html.ts";
import type {
  Img,
  Member,
  ProfileLink,
  Publication,
  Roster,
  Section,
  Story,
} from "../content/types.ts";
import { iconForLink, icons } from "./icons.ts";
import { rel } from "./url.ts";

/**
 * A headline count with the parts that make it up underneath.
 *
 * A stat tile rather than a chart: these are headline numbers, and three of
 * them side by side is a KPI row, not a grouped bar chart with four bars nobody
 * needs to compare across groups.
 *
 * The value carries no colour of its own. Colour here would imply the three
 * tiles encode different *kinds* of thing, which they do not — they are all
 * plain counts — so the numbers wear ordinary text ink and the tile relies on
 * size and position instead. The breakdown figures do get `tabular-nums`,
 * because they form a column that has to line up; the headline does not, since
 * fixed-width digits look loose at display sizes.
 */
export function statTile(options: {
  value: string;
  label: string;
  breakdown?: { label: string; value: number }[];
  index?: number;
}): string {
  const rows = (options.breakdown ?? []).filter((row) => row.value > 0);

  return join([
    `<article class="stat"${reveal(options.index ?? 0)}>`,
    `<p class="stat__value">${esc(options.value)}</p>`,
    `<p class="stat__label">${esc(options.label)}</p>`,
    rows.length > 0
      ? join([
          '<dl class="stat__breakdown">',
          rows
            .map((row) =>
              join([
                '<div class="stat__row">',
                `<dt>${esc(row.label)}</dt>`,
                `<dd>${row.value}</dd>`,
                "</div>",
              ]),
            )
            .join(""),
          "</dl>",
        ])
      : "",
    "</article>",
  ]);
}

/**
 * A collapsible list of names and where they came from.
 *
 * A native `<details>` rather than a scripted panel: it opens and closes with
 * JavaScript switched off, it is keyboard operable for free, and the browser's
 * own find-in-page will open it to reveal a match. The count sits in the
 * summary so the reader knows the size of the list before opening it.
 */
export function rosterList(roster: Roster, index = 0): string {
  return join([
    `<details class="roster"${reveal(index)}>`,
    '<summary class="roster__summary">',
    `<span class="roster__title">${esc(roster.title)}</span>`,
    `<span class="roster__count">${roster.entries.length}</span>`,
    "</summary>",
    '<ol class="roster__list">',
    roster.entries
      .map((entry) =>
        join([
          '<li class="roster__item">',
          `<span class="roster__name">${esc(entry.name)}</span>`,
          entry.affiliation
            ? `<span class="roster__affiliation">${esc(entry.affiliation)}</span>`
            : "",
          "</li>",
        ]),
      )
      .join(""),
    "</ol>",
    "</details>",
  ]);
}

/**
 * Marks a block to fade and rise into place as it is scrolled to.
 *
 * Emitted at build time rather than added by a script, so the element carries
 * the marker in the HTML itself and there is no moment where the block is drawn
 * and then hidden again. What the marker *does* is decided entirely in CSS —
 * see the `data-motion` gate in base.css.
 *
 * `index` staggers a row of siblings. The delay is capped so the last card in a
 * long grid is not still waiting after the reader has looked away.
 */
export function reveal(index = 0): string {
  const delay = Math.min(Math.max(index, 0), 5) * 70;
  return delay > 0 ? ` data-reveal style="--reveal-delay:${delay}ms"` : " data-reveal";
}

/** An `<img>` with srcset, intrinsic size and lazy loading. */
export function image(
  picture: Img,
  depth: number,
  options: { alt?: string; sizes?: string; eager?: boolean; className?: string } = {},
): string {
  const alt = options.alt ?? picture.alt ?? "";
  return join([
    "<img",
    attr("src", rel(depth, picture.src)),
    picture.srcset
      ? attr(
          "srcset",
          picture.srcset
            .split(", ")
            .map((entry) => {
              const [path, width] = entry.split(" ");
              return `${rel(depth, path ?? "")} ${width ?? ""}`;
            })
            .join(", "),
        )
      : "",
    options.sizes && picture.srcset ? attr("sizes", options.sizes) : "",
    // Width/height reserve space and stop the page jumping as images arrive.
    picture.width > 0 ? attr("width", picture.width) : "",
    picture.height > 0 ? attr("height", picture.height) : "",
    ` alt="${esc(alt)}"`,
    options.eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy" decoding="async"',
    attr("class", options.className),
    ">",
  ]);
}

/**
 * Profile and citation links.
 *
 * Returns an empty string when the list is empty, so a person or paper with no
 * links renders no element at all — no stray container, no gap.
 */
export function linkList(links: ProfileLink[], className = "profile-links"): string {
  if (links.length === 0) return "";
  const items = links
    .map(
      (link) =>
        `<li><a class="profile-link" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">` +
        `${iconForLink(link.kind)}<span>${esc(link.label)}</span></a></li>`,
    )
    .join("");
  return `<ul class="${esc(className)}">${items}</ul>`;
}

export function sectionHead(options: {
  eyebrow?: string;
  title: string;
  lead?: string;
  level?: 1 | 2;
}): string {
  const tag = options.level === 1 ? "h1" : "h2";
  return join([
    `<div class="section__head"${reveal()}>`,
    options.eyebrow ? `<p class="section__eyebrow">${esc(options.eyebrow)}</p>` : "",
    `<${tag}>${esc(options.title)}</${tag}>`,
    options.lead ? `<p class="section__lead">${esc(options.lead)}</p>` : "",
    "</div>",
  ]);
}

/**
 * The shared shape of a prose block: a text column, and a figure beside it when
 * one has been paired.
 *
 * Everything optional here draws nothing at all when it is absent — a section
 * with no kicker emits no empty kicker element — which is what lets one
 * function serve both a two-line text section and a full research story.
 *
 * The kicker, callout and citations sit *inside* the text column rather than
 * beside it. They are grid children otherwise, and a two-column block would put
 * the "why it matters" line where the picture should be.
 */
function prosePanel(
  parts: {
    id: string;
    eyebrow?: string;
    title: string;
    lead?: string;
    html: string;
    why?: string;
    papers?: Publication[];
    figure: Img | null;
    caption: string;
    modifier?: string;
  },
  depth: number,
  showTitle = true,
): string {
  const papers = parts.papers ?? [];

  /*
   * The prose, callout and citations are direct children of the block, with no
   * wrapper around them. That is load-bearing: a wrapper is a block box of its
   * own, and any box that establishes a formatting context — a grid, a flex
   * container, anything with `overflow` — refuses to overlap a float at all. It
   * would sit in a narrow column beside the picture for its whole height rather
   * than closing over the bottom of it, which is the entire point of the float.
   */
  const text = join([
    '<div class="prose">',
    parts.eyebrow ? `<p class="section__eyebrow">${esc(parts.eyebrow)}</p>` : "",
    showTitle ? `<h3>${esc(parts.title)}</h3>` : "",
    parts.lead ? `<p class="section__lead">${esc(parts.lead)}</p>` : "",
    parts.html,
    "</div>",

    parts.why
      ? join([
          '<aside class="callout">',
          `<p><span class="callout__label">Why it matters</span>${esc(parts.why)}</p>`,
          "</aside>",
        ])
      : "",

    papers.length > 0
      ? join([
          '<div class="section-block__papers">',
          `<p class="section-block__label">${papers.length === 1 ? "Publication" : "Publications"}</p>`,
          '<ul class="pub-list pub-list--trail">',
          papers
            .map(
              (paper) =>
                `<li class="pub"><p class="pub__citation">${paper.html}</p>${linkList(paper.links, "pub__links")}</li>`,
            )
            .join(""),
          "</ul>",
          "</div>",
        ])
      : "",
  ]);

  const classes = cls(
    "section-block",
    parts.figure && "section-block--figure",
    parts.modifier && `section-block--${parts.modifier}`,
  );

  /*
   * The figure is emitted before the prose because it is floated beside it, and
   * a float only wraps the content that follows it in the source. Put it after
   * the text and it drops to the bottom of the block, leaving a column of empty
   * space where the story should have carried on reading.
   */
  return join([
    `<div class="${classes}" id="${esc(parts.id)}"${reveal()}>`,
    parts.figure
      ? join([
          '<figure class="figure">',
          image(parts.figure, depth, {
            sizes: "(max-width: 700px) 100vw, 22rem",
            alt: parts.caption || parts.title,
          }),
          parts.caption ? `<figcaption>${esc(parts.caption)}</figcaption>` : "",
          "</figure>",
        ])
      : "",
    text,
    "</div>",
  ]);
}

/** A prose block, paired with its figure when one exists. */
export function sectionBlock(section: Section, depth: number, showTitle = true): string {
  return prosePanel(
    {
      id: section.slug,
      title: section.title,
      html: section.html,
      figure: section.figure,
      caption: section.caption,
    },
    depth,
    showTitle,
  );
}

/**
 * A research story: the same block with its optional parts filled in.
 *
 * `papers` arrives already resolved from the publications page, so the
 * citations shown here are the same strings that page prints — a story cannot
 * quietly disagree with the publication list about its own papers.
 */
export function storyBlock(story: Story, depth: number): string {
  return prosePanel(
    {
      id: story.slug,
      eyebrow: story.tag,
      title: story.title,
      lead: story.lead,
      html: story.html,
      why: story.why,
      papers: story.papers,
      figure: story.figure,
      caption: story.caption,
      modifier: "story",
    },
    depth,
  );
}

/**
 * A story on the home page: headline, the short version, and a way in.
 *
 * Wears `card--link` so it inherits the lift-on-hover and the whole-card click
 * target the institute links already use; only the meta line differs, because
 * this one goes to a place on this site rather than out to another.
 */
export function storyCard(
  options: { title: string; body: string; href: string; figure: Img | null },
  depth: number,
  index = 0,
): string {
  return join([
    `<article class="${cls("card", "card--link", options.figure && "card--onImage")}"${reveal(index)}>`,

    /*
     * The story's own figure, behind the words, under a scrim — the same
     * treatment as the banner, and for the same reason: the picture is there to
     * be recognised, not read, and the text on top has to stay legible whatever
     * the image turns out to look like. A story with no figure keeps the plain
     * card, so a missing picture costs nothing.
     *
     * Hidden from screen readers: it repeats the headline sitting on top of it.
     */
    options.figure
      ? join([
          '<div class="card__media" aria-hidden="true">',
          image(options.figure, depth, {
            alt: "",
            sizes: "(max-width: 600px) 100vw, 20rem",
          }),
          '</div><div class="card__scrim" aria-hidden="true"></div>',
        ])
      : "",

    `<h3 class="card__title"><a href="${esc(options.href)}">${esc(options.title)}</a></h3>`,
    options.body ? `<p class="card__body">${esc(options.body)}</p>` : "",
    `<p class="card__meta">${icons.arrowRight}<span>Read the story</span></p>`,
    "</article>",
  ]);
}

/**
 * Portrait, or the initials fallback when no photo has been uploaded.
 *
 * The portrait is the link to a person's own page when they have one, because
 * a face is the thing a reader aims at. The name is a link as well — a picture
 * on its own is a poor target for anybody using a screen reader or a keyboard.
 */
function portrait(member: Member, depth: number, sizes: string): string {
  const inside = member.photo
    ? image(member.photo, depth, { alt: `${member.name}, ${member.role}`, sizes })
    : `<div class="person__initials" aria-hidden="true">${esc(member.initials)}</div>`;

  return join([
    '<div class="person__portrait">',
    member.profilePath
      ? `<a class="person__portrait-link" href="${esc(rel(depth, member.profilePath))}" tabindex="-1" aria-hidden="true">${inside}</a>`
      : inside,
    "</div>",
  ]);
}

/** The person's name, linked to their own page when they have one. */
function personName(member: Member, depth: number): string {
  return member.profilePath
    ? `<h3 class="person__name"><a href="${esc(rel(depth, member.profilePath))}">${esc(member.name)}</a></h3>`
    : `<h3 class="person__name">${esc(member.name)}</h3>`;
}

/** The "read the full profile" line at the foot of a card that has a page. */
function profileLink(member: Member, depth: number): string {
  if (!member.profilePath) return "";
  return join([
    `<p class="person__more"><a href="${esc(rel(depth, member.profilePath))}">`,
    `<span>Full profile</span>${icons.arrowRight}`,
    "</a></p>",
  ]);
}

export function personCard(member: Member, depth: number, index = 0): string {
  return join([
    `<article class="person"${reveal(index)}>`,
    portrait(member, depth, "(max-width: 640px) 50vw, 15rem"),
    "<div>",
    personName(member, depth),
    `<p class="person__role">${esc(member.role)}</p>`,
    member.focus ? `<p class="person__focus">${esc(member.focus)}</p>` : "",
    "</div>",
    member.html ? `<div class="person__bio prose">${member.html}</div>` : "",
    member.email
      ? `<p class="person__focus"><a href="mailto:${esc(member.email)}">${esc(member.email)}</a></p>`
      : "",
    linkList(member.links),
    profileLink(member, depth),
    "</article>",
  ]);
}

/** The larger treatment used for the principal investigator. */
export function leadPersonCard(member: Member, depth: number): string {
  return join([
    `<article class="person person--lead"${reveal()}>`,
    portrait(member, depth, "(max-width: 640px) 60vw, 15rem"),
    '<div class="person">',
    "<div>",
    personName(member, depth),
    `<p class="person__role">${esc(member.role)}</p>`,
    member.focus ? `<p class="person__focus">${esc(member.focus)}</p>` : "",
    "</div>",
    member.html ? `<div class="prose">${member.html}</div>` : "",
    member.email
      ? `<p class="person__focus"><a href="mailto:${esc(member.email)}">${esc(member.email)}</a></p>`
      : "",
    linkList(member.links),
    profileLink(member, depth),
    "</div>",
    "</article>",
  ]);
}

/** An alumnus: thesis and current position rather than a biography. */
export function alumnusCard(member: Member, depth: number, index = 0): string {
  return join([
    `<article class="person"${reveal(index)}>`,
    portrait(member, depth, "(max-width: 640px) 50vw, 15rem"),
    "<div>",
    personName(member, depth),
    `<p class="person__role">${esc(join([member.role, member.year && `· ${member.year}`], " "))}</p>`,
    "</div>",
    member.thesis
      ? `<p class="person__focus"><span class="contact-card__label">Thesis</span>${esc(member.thesis)}</p>`
      : "",
    member.now
      ? `<p class="person__focus"><span class="contact-card__label">Now</span>${esc(member.now)}</p>`
      : "",
    member.html ? `<div class="person__bio prose">${member.html}</div>` : "",
    linkList(member.links),
    profileLink(member, depth),
    "</article>",
  ]);
}

/**
 * Shown where content would otherwise be missing, telling the reader — and more
 * usefully the editor — exactly which folder to put files in.
 */
export function emptyNote(message: string, path: string): string {
  return `<p class="empty-note">${esc(message)}<br><code>${esc(path)}</code></p>`;
}
