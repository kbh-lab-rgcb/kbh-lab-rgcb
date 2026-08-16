/**
 * Reusable markup fragments.
 *
 * Every one of these takes `depth` so image and link URLs come out relative to
 * the page being rendered. See `url.ts` for why.
 */

import { attr, esc, join } from "../html.ts";
import type { Img, Member, ProfileLink, Roster, Section } from "../content/types.ts";
import { iconForLink } from "./icons.ts";
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

/** A prose block, paired with its figure when one exists. */
export function sectionBlock(section: Section, depth: number, showTitle = true): string {
  const prose = join([
    '<div class="prose">',
    showTitle ? `<h3>${esc(section.title)}</h3>` : "",
    section.html,
    "</div>",
  ]);

  if (!section.figure) {
    return `<div class="section-block"${reveal()}>${prose}</div>`;
  }

  return join([
    `<div class="section-block section-block--figure"${reveal()}>`,
    prose,
    '<figure class="figure">',
    image(section.figure, depth, {
      sizes: "(max-width: 700px) 100vw, 40vw",
      alt: section.caption || section.title,
    }),
    section.caption ? `<figcaption>${esc(section.caption)}</figcaption>` : "",
    "</figure>",
    "</div>",
  ]);
}

/** Portrait, or the initials fallback when no photo has been uploaded. */
function portrait(member: Member, depth: number, sizes: string): string {
  return join([
    '<div class="person__portrait">',
    member.photo
      ? image(member.photo, depth, { alt: `${member.name}, ${member.role}`, sizes })
      : `<div class="person__initials" aria-hidden="true">${esc(member.initials)}</div>`,
    "</div>",
  ]);
}

export function personCard(member: Member, depth: number, index = 0): string {
  return join([
    `<article class="person"${reveal(index)}>`,
    portrait(member, depth, "(max-width: 640px) 50vw, 15rem"),
    "<div>",
    `<h3 class="person__name">${esc(member.name)}</h3>`,
    `<p class="person__role">${esc(member.role)}</p>`,
    member.focus ? `<p class="person__focus">${esc(member.focus)}</p>` : "",
    "</div>",
    member.html ? `<div class="person__bio prose">${member.html}</div>` : "",
    member.email
      ? `<p class="person__focus"><a href="mailto:${esc(member.email)}">${esc(member.email)}</a></p>`
      : "",
    linkList(member.links),
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
    `<h3 class="person__name">${esc(member.name)}</h3>`,
    `<p class="person__role">${esc(member.role)}</p>`,
    member.focus ? `<p class="person__focus">${esc(member.focus)}</p>` : "",
    "</div>",
    member.html ? `<div class="prose">${member.html}</div>` : "",
    member.email
      ? `<p class="person__focus"><a href="mailto:${esc(member.email)}">${esc(member.email)}</a></p>`
      : "",
    linkList(member.links),
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
    `<h3 class="person__name">${esc(member.name)}</h3>`,
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
