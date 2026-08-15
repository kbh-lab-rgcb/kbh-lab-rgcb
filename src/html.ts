/**
 * The single place HTML escaping happens.
 *
 * Every interpolation of content into markup goes through `esc` (or `attr` for
 * attribute values). Keeping it in one file is deliberate: the previous build
 * script re-declared its own escaper inline, which is exactly how one forgotten
 * call becomes a broken page.
 */

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape text for use in element content or attribute values. */
export function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/** Render an attribute, omitting it entirely when the value is empty. */
export function attr(name: string, value: unknown): string {
  const text = String(value ?? "").trim();
  return text ? ` ${name}="${esc(text)}"` : "";
}

/** Join class names, dropping falsy entries. */
export function cls(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/** Drop nulls and empty strings, then join. Keeps optional markup tidy. */
export function join(parts: (string | null | undefined | false)[], separator = ""): string {
  return parts.filter((part): part is string => Boolean(part)).join(separator);
}
