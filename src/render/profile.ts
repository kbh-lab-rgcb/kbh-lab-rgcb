/**
 * A person's own page: `team/harikumar-kb/index.html`.
 *
 * Opt-in, one line in their text file. A lab page that gives every student an
 * empty CV page would be worse than no CV pages at all, so nobody gets one
 * until they write `profile: yes` — and the page they then get is built from
 * whatever they wrote and nothing else. No placeholders, no "coming soon".
 */

import { esc, join } from "../html.ts";
import type { Member, Page, ProfileSection, PublicationYear, Site } from "../content/types.ts";
import { image, linkList, reveal } from "./components.ts";
import { citedAs, excerpt, field, parseDoiList } from "../content/text.ts";
import { icons } from "./icons.ts";
import { hrefTo } from "./url.ts";

/**
 * The papers this person is an author of.
 *
 * Worked out from the publications page rather than kept as a second list:
 * a citation corrected there is corrected here, and nobody has to remember
 * that a person's page exists when they add a paper.
 *
 * `papers:` in their text file overrides the matching with an explicit list of
 * DOIs, for the cases where a surname is too common to match on; `publications:
 * no` turns the section off altogether.
 */
export function papersFor(site: Site, member: Member): PublicationYear[] {
  if (/^(no|off|none|hide|false)$/i.test(field(member.fields, "publications"))) return [];

  const dois = parseDoiList(field(member.fields, "papers", "publications"));
  const mine = (citation: string, links: { kind: string; url: string }[]): boolean =>
    dois.length > 0
      ? links.some(
          (link) =>
            link.kind === "doi" && dois.includes(link.url.replace(/^https:\/\/doi\.org\//i, "").toLowerCase()),
        )
      : citedAs(citation, member.name);

  const years: PublicationYear[] = [];
  for (const page of site.pages) {
    for (const group of page.publicationYears) {
      const items = group.items.filter((item) => mine(item.citation, item.links));
      if (items.length > 0) years.push({ year: group.year, items });
    }
  }
  return years;
}

function profileSection(section: ProfileSection, index: number): string {
  return join([
    `<section class="profile-section"${reveal(index)}>`,
    `<h2 class="profile-section__title">${esc(section.title)}</h2>`,
    section.entries.length > 0
      ? join([
          '<dl class="cv">',
          section.entries
            .map((entry) =>
              join([
                '<div class="cv__row">',
                `<dt class="cv__term">${esc(entry.term)}</dt>`,
                `<dd class="cv__detail">${esc(entry.detail)}</dd>`,
                "</div>",
              ]),
            )
            .join(""),
          "</dl>",
        ])
      : `<div class="prose">${section.html}</div>`,
    "</section>",
  ]);
}

/** Alumni facts that would otherwise only exist on the card they came from. */
function facts(member: Member): string {
  const rows = [
    member.year && { label: "Finished", value: member.year },
    member.thesis && { label: "Thesis", value: member.thesis },
    member.now && { label: "Now", value: member.now },
  ].filter(Boolean) as { label: string; value: string }[];

  if (rows.length === 0) return "";

  return join([
    '<dl class="cv cv--facts">',
    rows
      .map((row) =>
        join([
          '<div class="cv__row">',
          `<dt class="cv__term">${esc(row.label)}</dt>`,
          `<dd class="cv__detail">${esc(row.value)}</dd>`,
          "</div>",
        ]),
      )
      .join(""),
    "</dl>",
  ]);
}

export function renderProfileBody(
  site: Site,
  parent: Page,
  member: Member,
  depth: number,
): string {
  const years = papersFor(site, member);
  const total = years.reduce((count, group) => count + group.items.length, 0);

  return join([
    '<section class="section"><div class="container container-narrow">',

    `<p class="profile__back"><a href="${esc(hrefTo(depth, parent))}">${icons.chevronLeft}<span>Back to ${esc(parent.title)}</span></a></p>`,

    `<div class="profile__head"${reveal()}>`,
    '<div class="person__portrait profile__portrait">',
    member.photo
      ? image(member.photo, depth, {
          alt: `${member.name}, ${member.role}`,
          sizes: "(max-width: 640px) 60vw, 16rem",
          eager: true,
        })
      : `<div class="person__initials" aria-hidden="true">${esc(member.initials)}</div>`,
    "</div>",
    '<div class="profile__intro">',
    member.focus ? `<p class="profile__focus">${esc(member.focus)}</p>` : "",
    member.email
      ? `<p class="profile__email"><a href="mailto:${esc(member.email)}">${esc(member.email)}</a></p>`
      : "",
    linkList(member.links),
    "</div>",
    "</div>",

    facts(member),

    member.html ? `<div class="prose profile__bio"${reveal()}>${member.html}</div>` : "",

    member.sections.map((section, index) => profileSection(section, index)).join(""),

    total > 0
      ? join([
          `<section class="profile-section"${reveal()}>`,
          `<h2 class="profile-section__title">Publications <span class="profile-section__count">${total}</span></h2>`,
          years
            .map((group) =>
              join([
                '<div class="pub-year">',
                `<h3 class="pub-year__label">${esc(group.year)}</h3>`,
                '<ul class="pub-list">',
                group.items
                  .map(
                    (item) =>
                      `<li class="pub"><p class="pub__citation">${item.html}</p>${linkList(item.links, "pub__links")}</li>`,
                  )
                  .join(""),
                "</ul>",
                "</div>",
              ]),
            )
            .join(""),
          "</section>",
        ])
      : "",

    "</div></section>",
  ]);
}

/** Meta description for a person's page: their own words, where they wrote any. */
export function profileDescription(member: Member): string {
  return excerpt(member.text, 200) || `${member.name} — ${member.role}`;
}

/**
 * The `Page` the shell is rendered against.
 *
 * A profile is not a page in the navigation — it borrows its parent's identity
 * so the Team link stays highlighted and the banner behind the name is the same
 * one the team page uses, and only replaces what is genuinely its own.
 */
export function profileShell(parent: Page, member: Member): Page {
  return {
    ...parent,
    title: member.name,
    tagline: member.role,
    introHtml: "",
    outDir: member.profilePath.replace(/\/+$/, ""),
  };
}
