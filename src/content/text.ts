/**
 * Parsing for the plain-text format lab members write.
 *
 *     key: value
 *     key: value
 *     <blank line>
 *     Body text, markdown allowed.
 *
 * Every function here is total: bad input produces a reasonable value rather
 * than an exception, because the person who typed it is editing in a browser
 * and will not see a stack trace.
 */

import { marked } from "marked";
import { esc } from "../html.ts";
import type { ProfileLink } from "./types.ts";

marked.setOptions({ gfm: true, breaks: false });

export type Doc = {
  fields: Record<string, string>;
  body: string;
};

/**
 * Keys recognised even when written *below* the body rather than in the header.
 *
 * People add a profile link months after writing their biography, and the
 * natural move is to type it at the bottom of the file. Rejecting that would
 * mean the link silently never appears and the raw `orcid: …` shows up as prose
 * — two failures at once. So these specific keys are lifted out wherever they
 * sit on a line of their own.
 *
 * Kept deliberately narrow: only unambiguous keys, never prose-like ones such
 * as `title` or `thesis`.
 */
const LIFTABLE_KEYS = new Set([
  "orcid",
  "scholar",
  "researchgate",
  "linkedin",
  "pubmed",
  "github",
  "twitter",
  "x",
  "website",
  "email",
  "url",
  "featured",
]);

/**
 * Split a file into its `key: value` header and its body.
 *
 * The header ends at the first blank line. A file with no header at all is
 * treated as pure body, so someone can drop in a paragraph and have it work.
 */
export function parseDoc(raw: string): Doc {
  const normalized = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return { fields: {}, body: "" };

  const lines = normalized.split("\n");
  const fields: Record<string, string> = {};
  let index = 0;
  let lastKey = "";

  for (; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      break;
    }
    const match = /^([A-Za-z][A-Za-z0-9 _-]{0,40}?)\s*:\s*(.*)$/.exec(line);
    if (!match) {
      /*
       * An indented line carries on the key above it. Some of these values are
       * whole sentences, and an editor whose window is narrower than the
       * sentence will wrap it — losing half a summary into the body, where it
       * would print as a stray paragraph, is a baffling way to be punished for
       * pressing Enter.
       */
      if (lastKey && /^\s+\S/.test(line)) {
        fields[lastKey] = `${fields[lastKey] ?? ""} ${line.trim()}`.trim();
        continue;
      }
      // Otherwise the header is over and this line is body. Bare prose files
      // therefore need no header at all.
      break;
    }
    lastKey = match[1]!.trim().toLowerCase().replace(/[\s_]+/g, "");
    fields[lastKey] = (match[2] ?? "").trim();
  }

  // Pull any liftable keys back out of the body, and drop those lines from it
  // so the raw `orcid: …` never renders as prose.
  const kept: string[] = [];
  for (const line of lines.slice(index)) {
    const match = /^([A-Za-z][A-Za-z0-9 _-]{0,20}?)\s*:\s*(\S.*)$/.exec(line.trim());
    const key = match ? match[1]!.trim().toLowerCase().replace(/[\s_]+/g, "") : "";
    if (match && LIFTABLE_KEYS.has(key) && !fields[key]) {
      fields[key] = match[2]!.trim();
    } else {
      kept.push(line);
    }
  }

  return { fields, body: kept.join("\n").replace(/\n{3,}/g, "\n\n").trim() };
}

/** Read a field, treating missing and empty-but-present as the same thing. */
export function field(fields: Record<string, string>, ...names: string[]): string {
  for (const name of names) {
    const value = fields[name.toLowerCase().replace(/[\s_]+/g, "")];
    if (value && value.trim()) return value.trim();
  }
  return "";
}

/** True only for explicit affirmatives, so a stray value never enables a flag. */
export function flag(value: string): boolean {
  return /^(yes|y|true|on|1)$/i.test(value.trim());
}

/**
 * Strip a `NN-` ordering prefix from a filename.
 *
 * `03-arun-v.jpg` -> order 3, slug `arun-v`. Files without a prefix sort after
 * prefixed ones, alphabetically.
 */
export function parseName(filename: string): { order: number; slug: string } {
  const base = filename.replace(/\.[^.]+$/, "");
  const match = /^(\d{1,4})[-_.\s]+(.*)$/.exec(base);
  if (match && match[2]) {
    return { order: Number(match[1]), slug: slugify(match[2]) };
  }
  return { order: Number.POSITIVE_INFINITY, slug: slugify(base) };
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** `sphingolipid-signalling` -> `Sphingolipid signalling`. */
export function titleFromSlug(slug: string): string {
  const words = slug.replace(/-/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}

/** `Dr. K.B. Harikumar` -> `KH`. Used for the fallback avatar. */
export function initialsOf(name: string): string {
  const words = name
    .replace(/\b(dr|prof|mr|ms|mrs|shri|smt)\.?\s+/gi, "")
    .split(/[\s.]+/)
    .filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

/** Markdown -> HTML for section and biography bodies. */
export function renderMarkdown(body: string): string {
  if (!body.trim()) return "";
  return marked.parse(body, { async: false }).trim();
}

/** Body text with markdown syntax removed, for meta tags and excerpts. */
export function plainText(body: string): string {
  return body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cut text to a whole word at or under `limit` characters. */
export function excerpt(text: string, limit: number): string {
  const clean = plainText(text);
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.]$/, "")}…`;
}

/* ------------------------------------------------------------------ *
 * Profile links
 * ------------------------------------------------------------------ */

type LinkSpec = {
  label: string;
  /** Turn a bare identifier into a full URL. */
  fromId: (id: string) => string;
  /** Reject bare ids that are obviously not ids for this service. */
  validId?: RegExp;
};

/**
 * Supported profile keys. A key absent from a member's file produces no markup
 * at all — that is the whole contract, so this table is the only place a new
 * service needs adding.
 */
const LINK_SPECS: Record<string, LinkSpec> = {
  orcid: {
    label: "ORCID",
    fromId: (id) => `https://orcid.org/${id}`,
    validId: /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i,
  },
  scholar: {
    label: "Google Scholar",
    fromId: (id) => `https://scholar.google.com/citations?user=${encodeURIComponent(id)}`,
  },
  researchgate: {
    label: "ResearchGate",
    fromId: (id) => `https://www.researchgate.net/profile/${encodeURIComponent(id)}`,
  },
  linkedin: {
    label: "LinkedIn",
    fromId: (id) => `https://www.linkedin.com/in/${encodeURIComponent(id)}`,
  },
  pubmed: {
    label: "PubMed",
    fromId: (id) =>
      /^\d+$/.test(id)
        ? `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        : `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(id)}`,
  },
  github: {
    label: "GitHub",
    fromId: (id) => `https://github.com/${encodeURIComponent(id)}`,
  },
  twitter: {
    label: "X",
    fromId: (id) => `https://x.com/${encodeURIComponent(id.replace(/^@/, ""))}`,
  },
  website: {
    label: "Website",
    fromId: (id) => `https://${id}`,
  },
};

/** Order links are displayed in, regardless of the order they were written. */
const LINK_ORDER = [
  "orcid",
  "scholar",
  "pubmed",
  "researchgate",
  "website",
  "github",
  "linkedin",
  "twitter",
];

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : /^www\./i.test(trimmed)
      ? `https://${trimmed}`
      : null;
  if (!withScheme) return null;
  try {
    return new URL(withScheme).href;
  } catch {
    return null;
  }
}

/**
 * Build the profile links a member actually supplied.
 *
 * Accepts either a full URL or a bare identifier for every service, because an
 * editor should not have to know which form is expected.
 */
export function profileLinks(fields: Record<string, string>): ProfileLink[] {
  const found: ProfileLink[] = [];

  for (const [kind, spec] of Object.entries(LINK_SPECS)) {
    const raw = field(fields, kind, kind === "twitter" ? "x" : kind);
    if (!raw) continue;

    const asUrl = normalizeUrl(raw);
    if (asUrl) {
      found.push({ kind, label: spec.label, url: asUrl });
      continue;
    }

    const id = raw.replace(/^@/, "").replace(/\/+$/, "");
    if (spec.validId && !spec.validId.test(id)) continue;
    found.push({ kind, label: spec.label, url: spec.fromId(id) });
  }

  return found.sort((a, b) => {
    const ai = LINK_ORDER.indexOf(a.kind);
    const bi = LINK_ORDER.indexOf(b.kind);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

/* ------------------------------------------------------------------ *
 * Publications
 * ------------------------------------------------------------------ */

const DOI_URL = /https?:\/\/(?:dx\.)?doi\.org\/(10\.\d{4,9}\/\S+)/gi;
const DOI_KEY = /\bdoi\s*[:=]\s*(10\.\d{4,9}\/\S+)/gi;
const PMID_KEY = /\bpmid\s*[:=]\s*(\d{4,9})\b/gi;
const PMID_URL = /https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{4,9})\/?/gi;
const PMC_KEY = /\bpmc\s*[:=]\s*(PMC\d{4,9})\b/gi;
const BARE_URL = /https?:\/\/\S+/gi;

/** Trailing punctuation belongs to the sentence, not the identifier. */
function trimId(value: string): string {
  return value.replace(/[.,;)\]]+$/, "");
}

/**
 * Pull identifiers off a citation line.
 *
 * Returns the citation with the identifiers removed plus one link per
 * identifier found. A line with no identifier yields an empty `links` array,
 * and the renderer then draws no button — same only-if-added rule as profiles.
 */
export function parseCitation(line: string): { citation: string; links: ProfileLink[] } {
  let rest = line.trim();
  const links: ProfileLink[] = [];
  const seen = new Set<string>();

  const take = (pattern: RegExp, build: (id: string) => ProfileLink) => {
    rest = rest.replace(pattern, (match, captured: string) => {
      const id = trimId(captured);
      if (!id) return match;
      const link = build(id);
      if (!seen.has(link.url)) {
        seen.add(link.url);
        links.push(link);
      }
      return " ";
    });
  };

  // DOI and PubMed URLs are recognised before the generic URL sweep, so a
  // pasted doi.org link becomes a proper "DOI" button rather than "Link".
  take(DOI_URL, (id) => ({ kind: "doi", label: "DOI", url: `https://doi.org/${id}` }));
  take(DOI_KEY, (id) => ({ kind: "doi", label: "DOI", url: `https://doi.org/${id}` }));
  take(PMID_URL, (id) => ({
    kind: "pmid",
    label: "PubMed",
    url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
  }));
  take(PMID_KEY, (id) => ({
    kind: "pmid",
    label: "PubMed",
    url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
  }));
  take(PMC_KEY, (id) => ({
    kind: "pmc",
    label: "PMC",
    url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${id}/`,
  }));
  take(BARE_URL, (id) => ({ kind: "url", label: "Full text", url: id }));

  const citation = rest
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;])/g, "$1")
    .replace(/[\s.,;]+$/, "")
    .trim();

  return { citation: citation ? `${citation}.` : "", links };
}

/**
 * DOIs from a `papers:` line, however the editor pasted them.
 *
 * A bare DOI, a `doi:` prefix and a full doi.org address are all the same
 * thing to whoever copied it out of a paper, so all three are accepted and
 * separated by commas, semicolons or plain spaces. Anything that is not
 * recognisably a DOI is dropped rather than turned into a broken link — the
 * caller warns about the difference between what was written and what was
 * understood.
 *
 * Lower-cased because DOIs are case-insensitive and these are used as map keys.
 */
export function parseDoiList(value: string): string[] {
  const found: string[] = [];
  for (const token of value.split(/[\s,;]+/)) {
    const doi = trimId(
      token
        .trim()
        .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
        .replace(/^doi\s*[:=]\s*/i, ""),
    ).toLowerCase();
    if (/^10\.\d{4,9}\/\S+$/.test(doi) && !found.includes(doi)) found.push(doi);
  }
  return found;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Bold the lab's own authors in a citation.
 *
 * Matches the surname plus any following initials (`Harikumar KB`,
 * `Harikumar K B`), which is how these appear in every journal style.
 * Escaping happens first; surnames are plain letters so they survive it.
 */
export function boldAuthors(citation: string, surnames: string[]): string {
  let html = esc(citation);
  for (const surname of surnames) {
    if (!surname.trim()) continue;
    const pattern = new RegExp(
      `\\b${escapeRegExp(surname.trim())}(\\s+[A-Z](?:\\s?[A-Z])?)?(?![\\w-])`,
      "g",
    );
    html = html.replace(pattern, (match) => `<strong>${match}</strong>`);
  }
  return html;
}
