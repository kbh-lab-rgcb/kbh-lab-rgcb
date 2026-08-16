/**
 * One renderer per page kind, dispatched from `renderPageBody`.
 *
 * Each renderer degrades to a helpful note when its folder is empty, telling
 * the editor which path to add files to rather than showing a blank page.
 */

import { esc, join } from "../html.ts";
import type { Member, Page, Site } from "../content/types.ts";
import {
  alumnusCard,
  emptyNote,
  image,
  leadPersonCard,
  linkList,
  personCard,
  reveal,
  sectionBlock,
  sectionHead,
} from "./components.ts";
import { icons } from "./icons.ts";
import { hrefTo, rel } from "./url.ts";

/** Find a page by kind, so the home page can borrow from the others. */
function pageOf(site: Site, kind: Page["kind"]): Page | undefined {
  return site.pages.find((page) => page.kind === kind);
}

function isLead(member: Member): boolean {
  return (
    /principal investigator|^pi$|group leader|scientist [a-z]$|professor/i.test(member.role) ||
    /^(yes|true)$/i.test(member.fields.lead ?? "")
  );
}

function sectionsBlock(page: Page, depth: number): string {
  if (page.sections.length === 0) return "";
  return page.sections.map((section) => sectionBlock(section, depth, true)).join("");
}

/**
 * The page's opening prose: the body of `page.txt` followed by any `text/`
 * sections. Renders nothing at all when the page has neither.
 */
function introBlock(page: Page, depth: number): string {
  const parts = [
    page.introHtml ? `<div class="prose">${page.introHtml}</div>` : "",
    sectionsBlock(page, depth),
  ].filter(Boolean);
  if (parts.length === 0) return "";
  return `<section class="section"><div class="container">${parts.join("")}</div></section>`;
}

/* ------------------------------------------------------------------- Home */

function renderHome(site: Site, page: Page, depth: number): string {
  const teamPage = pageOf(site, "team");
  const publicationsPage = pageOf(site, "publications");
  const linksPage = pageOf(site, "links");

  const members = teamPage?.members ?? [];
  const lead = members.find(isLead);
  const recent = publicationsPage?.publicationYears[0];
  const featured = (linksPage?.links ?? []).filter((link) => link.featured);

  const stats = [
    members.length > 0 ? { value: String(members.length), label: "People in the lab" } : null,
    publicationsPage && publicationsPage.publicationYears.length > 0
      ? {
          value: String(
            publicationsPage.publicationYears.reduce((total, year) => total + year.items.length, 0),
          ),
          label: "Selected publications",
        }
      : null,
    (pageOf(site, "alumni")?.members.length ?? 0) > 0
      ? { value: String(pageOf(site, "alumni")!.members.length), label: "Alumni" }
      : null,
  ].filter((stat): stat is { value: string; label: string } => stat !== null);

  return join([
    introBlock(page, depth) ||
      `<section class="section"><div class="container">${emptyNote(
        "Add an introduction by creating a text file in",
        "content/pages/01-home/text/01-welcome.txt",
      )}</div></section>`,

    stats.length > 0
      ? join([
          '<section class="section"><div class="container"><div class="stats">',
          stats
            .map(
              (stat, index) =>
                `<div class="stat"${reveal(index)}><p class="stat__value">${esc(stat.value)}</p><p class="stat__label">${esc(stat.label)}</p></div>`,
            )
            .join(""),
          "</div></div></section>",
        ])
      : "",

    lead
      ? join([
          '<section class="section section--sunken"><div class="container">',
          sectionHead({ eyebrow: "Principal investigator", title: lead.name }),
          leadPersonCard(lead, depth),
          "</div></section>",
        ])
      : "",

    recent && publicationsPage
      ? join([
          '<section class="section"><div class="container">',
          sectionHead({
            eyebrow: "Recent work",
            title: `Publications from ${recent.year}`,
          }),
          `<ul class="pub-list"${reveal()}>`,
          recent.items
            .slice(0, 4)
            .map(
              (item) =>
                `<li class="pub"><p class="pub__citation">${item.html}</p>${linkList(item.links, "pub__links")}</li>`,
            )
            .join(""),
          "</ul>",
          `<p class="button-row"><a class="button button--ghost" href="${esc(hrefTo(depth, publicationsPage))}">All publications ${icons.arrowRight}</a></p>`,
          "</div></section>",
        ])
      : "",

    members.length > 0 && teamPage
      ? join([
          '<section class="section section--sunken"><div class="container">',
          sectionHead({ eyebrow: "The lab", title: "Who you will work with" }),
          '<div class="grid grid--people">',
          members
            .filter((member) => !isLead(member))
            .slice(0, 8)
            .map((member, index) => personCard(member, depth, index))
            .join(""),
          "</div>",
          `<p class="button-row"><a class="button button--ghost" href="${esc(hrefTo(depth, teamPage))}">Full team ${icons.arrowRight}</a></p>`,
          "</div></section>",
        ])
      : "",

    featured.length > 0
      ? join([
          '<section class="section"><div class="container">',
          sectionHead({ eyebrow: "Elsewhere", title: "Institute resources" }),
          '<div class="grid grid--cards">',
          featured.map((link, index) => linkCard(link, index)).join(""),
          "</div></div></section>",
        ])
      : "",
  ]);
}

/* --------------------------------------------------------------- Research */

function renderSectionsPage(page: Page, depth: number, folder: string): string {
  return (
    introBlock(page, depth) ||
    `<section class="section"><div class="container">${emptyNote(
      "Add content by creating a text file in",
      `${folder}/text/01-overview.txt`,
    )}</div></section>`
  );
}

/* ------------------------------------------------------------------- Team */

function renderTeam(page: Page, depth: number, folder: string): string {
  const lead = page.members.find(isLead);
  const rest = page.members.filter((member) => member !== lead);

  return join([
    introBlock(page, depth),

    lead
      ? join([
          '<section class="section"><div class="container">',
          sectionHead({ eyebrow: "Principal investigator", title: lead.name }),
          leadPersonCard(lead, depth),
          "</div></section>",
        ])
      : "",

    '<section class="section"><div class="container">',
    rest.length > 0
      ? join([
          sectionHead({ eyebrow: "Members", title: "Researchers and students" }),
          `<div class="grid grid--people">${rest.map((member, index) => personCard(member, depth, index)).join("")}</div>`,
        ])
      : page.members.length === 0
        ? emptyNote(
            "Add a person by putting a photo and a matching text file in",
            `${folder}/photos/ and ${folder}/text/`,
          )
        : "",
    "</div></section>",
  ]);
}

/* ----------------------------------------------------------------- Alumni */

function renderAlumni(page: Page, depth: number, folder: string): string {
  return join([
    introBlock(page, depth),
    '<section class="section"><div class="container">',
    page.members.length > 0
      ? `<div class="grid grid--people">${page.members.map((member, index) => alumnusCard(member, depth, index)).join("")}</div>`
      : emptyNote("Add an alumnus by putting a text file in", `${folder}/text/`),
    "</div></section>",
  ]);
}

/* ----------------------------------------------------------- Publications */

function renderPublications(page: Page, depth: number, folder: string): string {
  if (page.publicationYears.length === 0) {
    return `<section class="section"><div class="container">${emptyNote(
      "Add papers by creating one file per year in",
      `${folder}/years/2026.txt`,
    )}</div></section>`;
  }

  return join([
    introBlock(page, depth),
    '<section class="section"><div class="container">',
    page.publicationYears
      .map((group) =>
        join([
          `<div class="pub-year"${reveal()}>`,
          `<h2 class="pub-year__label">${esc(group.year)}</h2>`,
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
    "</div></section>",
  ]);
}

/* ---------------------------------------------------------------- Gallery */

function renderGallery(page: Page, depth: number, folder: string): string {
  return join([
    introBlock(page, depth),
    '<section class="section"><div class="container">',
    page.gallery.length > 0
      ? join([
          '<div class="gallery">',
          page.gallery
            .map((item, index) =>
              join([
                `<button class="gallery__item" type="button" data-lightbox`,
                // The lightbox shows the largest variant, not the thumbnail.
                ` data-full="${esc(rel(depth, item.photo.src))}"`,
                ` data-caption="${esc(item.caption || item.title)}"`,
                `${reveal(index)}>`,
                image(item.photo, depth, {
                  alt: item.caption || item.title,
                  sizes: "(max-width: 600px) 50vw, 14rem",
                }),
                item.caption
                  ? `<span class="gallery__caption">${esc(item.caption)}</span>`
                  : "",
                "</button>",
              ]),
            )
            .join(""),
          "</div>",
        ])
      : emptyNote("Add photos to", `${folder}/photos/`),
    "</div></section>",
  ]);
}

/* ---------------------------------------------------------------- Contact */

function renderContact(site: Site, page: Page, depth: number): string {
  const { config } = site;

  return join([
    '<section class="section"><div class="container">',
    '<div class="contact-grid">',

    config.address.length > 0
      ? join([
          `<div class="contact-card"${reveal(0)}>`,
          `<h3>${icons.pin} Address</h3>`,
          `<address>${config.address.map((line) => esc(line)).join("<br>")}</address>`,
          "</div>",
        ])
      : "",

    config.emails.length > 0
      ? join([
          `<div class="contact-card"${reveal(1)}>`,
          `<h3>${icons.mail} Email</h3><ul>`,
          config.emails
            .map(
              (entry) =>
                `<li><span class="contact-card__label">${esc(entry.label)}</span><a href="mailto:${esc(entry.value)}">${esc(entry.value)}</a></li>`,
            )
            .join(""),
          "</ul></div>",
        ])
      : "",

    config.phones.length > 0
      ? join([
          `<div class="contact-card"${reveal(2)}>`,
          `<h3>${icons.phone} Phone</h3><ul>`,
          config.phones
            .map(
              (entry) =>
                `<li><span class="contact-card__label">${esc(entry.label)}</span><a href="tel:${esc(entry.value.replace(/[^\d+]/g, ""))}">${esc(entry.value)}</a></li>`,
            )
            .join(""),
          "</ul></div>",
        ])
      : "",

    "</div>",
    "</div></section>",
    introBlock(page, depth),
  ]);
}

/* ------------------------------------------------------------------ Links */

function linkCard(
  link: { title: string; url: string; description: string },
  index = 0,
): string {
  let host = "";
  try {
    host = new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    host = link.url;
  }
  return join([
    `<article class="card card--link"${reveal(index)}>`,
    `<h3 class="card__title"><a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.title)}</a></h3>`,
    link.description ? `<p class="card__body">${esc(link.description)}</p>` : "",
    `<p class="card__meta">${icons.external}<span>${esc(host)}</span></p>`,
    "</article>",
  ]);
}

function renderLinks(page: Page, depth: number, folder: string): string {
  return join([
    introBlock(page, depth),
    '<section class="section"><div class="container">',
    page.links.length > 0
      ? `<div class="grid grid--cards">${page.links.map((link, index) => linkCard(link, index)).join("")}</div>`
      : emptyNote("Add a link by creating a text file in", `${folder}/links/`),
    "</div></section>",
  ]);
}

/* --------------------------------------------------------------- Dispatch */

export function renderPageBody(site: Site, page: Page, depth: number): string {
  const folder = `content/pages/${page.slug}`;
  switch (page.kind) {
    case "home":
      return renderHome(site, page, depth);
    case "team":
      return renderTeam(page, depth, folder);
    case "alumni":
      return renderAlumni(page, depth, folder);
    case "publications":
      return renderPublications(page, depth, folder);
    case "gallery":
      return renderGallery(page, depth, folder);
    case "contact":
      return renderContact(site, page, depth);
    case "links":
      return renderLinks(page, depth, folder);
    default:
      return renderSectionsPage(page, depth, folder);
  }
}

/** Meta description: the page's own words where it has any. */
export function descriptionFor(site: Site, page: Page): string {
  const fromIntro = page.introHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const text =
    page.tagline ||
    fromIntro ||
    page.sections[0]?.text ||
    site.config.description ||
    site.config.tagline;
  return text.length > 300 ? `${text.slice(0, 297).trimEnd()}…` : text;
}
