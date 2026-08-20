/**
 * The page shell every page is rendered into: head, header, banner, footer.
 */

import { attr, esc, join } from "../html.ts";
import type { Img, Page, Site } from "../content/types.ts";
import { icons } from "./icons.ts";
import { image } from "./components.ts";
import { hrefTo, rel } from "./url.ts";

/**
 * Applies the saved theme, and switches the scroll-reveal animations on, before
 * first paint.
 *
 * Inlined in `<head>` on purpose. Loaded as an external file this would run
 * after the first paint: the reader would see a flash of the wrong theme, and
 * the blocks that are supposed to fade in would appear and then blink out.
 *
 * `data-motion` is what makes those blocks start hidden, so it is only set when
 * JavaScript is actually running and the reader has not asked for reduced
 * motion. The timeout is the failsafe for the remaining case — main.js being
 * blocked, or failing to load — where nothing would ever reveal them again. It
 * removes the attribute unless main.js has reported in, and the page settles
 * back to being plain and readable.
 */
const THEME_BOOT =
  `(function(){var r=document.documentElement;` +
  `try{var t=localStorage.getItem('crp7-theme');if(t==='light'||t==='dark'){r.setAttribute('data-theme',t);}}catch(e){}` +
  `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){r.setAttribute('data-motion','on');` +
  `setTimeout(function(){if(r.getAttribute('data-booted')!=='true'){r.removeAttribute('data-motion');}},2500);}}catch(e){}` +
  `})();`;

function banner(page: Page, depth: number, site: Site): string {
  const images = page.banners;
  const isHome = page.kind === "home";
  const heading = isHome ? site.config.name : page.title;
  const lead = isHome ? site.config.tagline : page.tagline;

  const modifier = images.length > 0 ? "banner--image" : "banner--empty";
  const tall = isHome ? " banner--tall" : "";

  const slides = images
    .map(
      (picture, index) =>
        `<div class="banner__slide" data-slide${attr("data-active", index === 0 ? "true" : "")}>` +
        image(picture, depth, {
          alt: "",
          sizes: "100vw",
          eager: index === 0,
        }) +
        "</div>",
    )
    .join("");

  // Controls exist only for a real carousel. One image is just a banner.
  const controls =
    images.length > 1
      ? join([
          '<div class="banner__controls" data-carousel-controls role="group" aria-label="Banner images">',
          `<button class="banner__arrow" type="button" data-carousel-prev aria-label="Previous image">${icons.chevronLeft}</button>`,
          '<div class="banner__dots">',
          images
            .map(
              (_, index) =>
                `<button class="banner__dot" type="button" data-dot aria-label="Image ${index + 1}"${attr("aria-current", index === 0 ? "true" : "false")}></button>`,
            )
            .join(""),
          "</div>",
          `<button class="banner__arrow" type="button" data-carousel-next aria-label="Next image">${icons.chevronRight}</button>`,
          "</div>",
        ])
      : "";

  return join([
    `<section class="banner ${modifier}${tall}">`,
    images.length > 0
      ? `<div class="banner__media"${images.length > 1 ? " data-carousel" : ""}>${slides}</div><div class="banner__scrim"></div>`
      : '<div class="banner__media"></div>',
    '<div class="container banner__inner">',
    isHome && site.config.shortName
      ? `<p class="banner__eyebrow">${esc(site.config.shortName)}</p>`
      : `<p class="banner__eyebrow">${esc(site.config.shortName || site.config.name)}</p>`,
    `<h1>${esc(heading)}</h1>`,
    lead ? `<p class="banner__lead">${esc(lead)}</p>` : "",
    isHome
      ? join([
          '<div class="button-row">',
          `<a class="button${images.length ? " button--onImage" : ""}" href="${esc(rel(depth, "research/"))}">Our research ${icons.arrowRight}</a>`,
          `<a class="button button--ghost${images.length ? " button--onImage" : ""}" href="${esc(rel(depth, "team/"))}">Meet the team</a>`,
          "</div>",
        ])
      : "",
    "</div>",
    controls,
    "</section>",
  ]);
}

function header(site: Site, current: Page, depth: number): string {
  const links = site.pages
    .map((page) => {
      const active = page.slug === current.slug;
      return `<a class="nav__link" href="${esc(hrefTo(depth, page))}"${active ? ' aria-current="page"' : ""}>${esc(page.title)}</a>`;
    })
    .join("");

  return join([
    '<header class="site-header">',
    '<div class="container site-header__inner">',
    `<a class="brand" href="${esc(rel(depth, ""))}">`,
    `<span class="brand__mark" aria-hidden="true">${esc(site.config.shortName.slice(0, 4) || "LAB")}</span>`,
    '<span class="brand__text">',
    `<span class="brand__name">${esc(site.config.shortName || site.config.name)}</span>`,
    site.config.institute ? `<span class="brand__sub">${esc(site.config.institute)}</span>` : "",
    "</span>",
    "</a>",
    `<nav class="nav" data-nav aria-label="Main">${links}</nav>`,
    '<div class="header__actions">',
    `<button class="icon-button" type="button" data-theme-toggle aria-label="Switch theme">` +
      `<span class="theme-toggle__sun">${icons.sun}</span><span class="theme-toggle__moon">${icons.moon}</span></button>`,
    `<button class="icon-button nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-label="Open menu">${icons.menu}</button>`,
    "</div>",
    "</div>",
    "</header>",
  ]);
}

function footer(site: Site, depth: number): string {
  const { config } = site;
  const year = new Date().getFullYear();

  return join([
    '<footer class="site-footer">',
    '<div class="container">',
    '<div class="site-footer__grid">',

    "<div>",
    `<h2>${esc(config.shortName || "Lab")}</h2>`,
    config.address.length
      ? `<address>${config.address.map((line) => esc(line)).join("<br>")}</address>`
      : "",
    "</div>",

    "<div><h2>Pages</h2><ul>",
    site.pages
      .map((page) => `<li><a href="${esc(hrefTo(depth, page))}">${esc(page.title)}</a></li>`)
      .join(""),
    "</ul></div>",

    config.emails.length || config.phones.length
      ? join([
          "<div><h2>Contact</h2><ul>",
          config.emails
            .map(
              (entry) =>
                `<li><span class="contact-card__label">${esc(entry.label)}</span><a href="mailto:${esc(entry.value)}">${esc(entry.value)}</a></li>`,
            )
            .join(""),
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
    '<div class="site-footer__bottom">',
    `<span>© ${year} ${esc(config.name)}</span>`,
    config.footerNote ? `<span>${esc(config.footerNote)}</span>` : "",
    "</div>",
    "</div>",
    "</footer>",
  ]);
}

/**
 * Absolute URLs for the things that cannot be relative.
 *
 * Every link the site emits is relative, which is what lets the same output
 * work at a project path, on a custom domain and straight off disk. Link
 * previews and canonical tags are the exception — a chat client resolving
 * `../assets/…` against its own host gets nothing — so these are the only
 * absolute URLs on the page, and they exist only when `url` is set in
 * `site.json`. Left out, the page is exactly as it was before.
 */
function absolute(site: Site, path: string): string {
  const base = site.config.url.replace(/\/+$/, "");
  if (!base) return "";
  return `${base}/${path.replace(/^\/+/, "")}`;
}

/**
 * The picture a link to this page unfurls with: its own banner, or the first
 * photograph the site has anywhere.
 *
 * SVGs are skipped rather than preferred-against: several chat clients render
 * nothing at all for them, and a preview with an empty box where the picture
 * should be is worse than a preview with no picture.
 */
function shareImage(site: Site, page: Page): string {
  const raster = (picture: Img) => !picture.src.toLowerCase().endsWith(".svg");
  const picture =
    page.banners.find(raster) ??
    site.pages.flatMap((other) => other.banners).find(raster);
  return picture ? absolute(site, picture.src) : "";
}

export function renderDocument(options: {
  site: Site;
  page: Page;
  depth: number;
  body: string;
  description: string;
}): string {
  const { site, page, depth, body, description } = options;
  const pageUrl = absolute(site, page.outDir ? `${page.outDir}/` : "");
  const shareUrl = shareImage(site, page);
  const title =
    page.kind === "home"
      ? site.config.name
      : `${page.title} · ${site.config.shortName || site.config.name}`;

  return join([
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    '<meta property="og:type" content="website">',
    site.config.name ? `<meta property="og:site_name" content="${esc(site.config.name)}">` : "",
    pageUrl ? `<meta property="og:url" content="${esc(pageUrl)}">` : "",
    pageUrl ? `<link rel="canonical" href="${esc(pageUrl)}">` : "",
    shareUrl ? `<meta property="og:image" content="${esc(shareUrl)}">` : "",
    shareUrl ? '<meta name="twitter:card" content="summary_large_image">' : "",
    '<meta name="theme-color" content="#0e7490" media="(prefers-color-scheme: light)">',
    '<meta name="theme-color" content="#0d1520" media="(prefers-color-scheme: dark)">',
    `<link rel="icon" href="${esc(rel(depth, "favicon.svg"))}" type="image/svg+xml">`,
    `<link rel="stylesheet" href="${esc(rel(depth, "styles.css"))}">`,
    `<script>${THEME_BOOT}</script>`,
    "</head>",
    "<body>",
    '<a class="skip-link" href="#main">Skip to content</a>',
    header(site, page, depth),
    banner(page, depth, site),
    `<main id="main">${body}</main>`,
    footer(site, depth),
    `<script src="${esc(rel(depth, "main.js"))}" defer></script>`,
    "</body>",
    "</html>",
  ]);
}
