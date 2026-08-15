import { readFile, mkdir, rm, cp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
execFileSync(process.execPath, [join(root, "scripts", "sync-content.mjs")], { stdio: "inherit" });
const data = JSON.parse(await readFile(join(root, "content.generated.json"), "utf8"));
const docs = join(root, "docs");
await rm(docs, { recursive: true, force: true });
await mkdir(docs, { recursive: true });
await cp(join(root, "public", "members"), join(docs, "members"), { recursive: true });
let css = await readFile(join(root, "app", "globals.css"), "utf8");
css = css.replace('@import "tailwindcss";', "");
await writeFile(join(docs, "styles.css"), css);
await writeFile(join(docs, ".nojekyll"), "");

const e = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
const arrow = '<span aria-hidden="true">↗</span>';
const research = data.research.map((item, i) => `<article class="research-card"><div class="research-art art-${i + 1}" aria-hidden="true"><span></span><span></span><span></span></div><p class="card-index">0${i + 1}</p><h3>${e(item.title)}</h3><p>${e(item.description)}</p><a href="#publications">Selected work ${arrow}</a></article>`).join("");
const members = data.members.map((member, i) => `<article class="person-card"><div class="portrait-wrap"><img src=".${e(member.photo)}" alt="${e(member.name)}, ${e(member.role)}"><span>0${i + 1}</span></div><h3>${e(member.name)}</h3><p class="role">${e(member.role)}</p><p class="bio">${e(member.bio)}</p>${member.email ? `<a href="mailto:${e(member.email)}">${e(member.email)} ${arrow}</a>` : ""}</article>`).join("");
const publications = data.publications.map((p) => `<article><p>${e(p.year)} <span>${e(p.journal)}</span></p><h3>${e(p.title)}</h3><a href="${e(p.url || "#")}">${arrow}</a></article>`).join("");
const mark = '<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>';

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${e(data.pages.about)}"><title>${e(data.lab.name)}</title><link rel="stylesheet" href="./styles.css"></head><body><main>
<header class="site-header"><a class="brand" href="#top">${mark}<span>${e(data.lab.shortName)}</span></a><nav><a href="#research">Research</a><a href="#people">People</a><a href="#publications">Publications</a><a class="nav-cta" href="#join">Join the lab ${arrow}</a></nav></header>
<section class="hero" id="top"><div class="hero-copy"><p class="kicker"><span></span>${e(data.lab.eyebrow)}</p><h1>${e(data.lab.title)}</h1><p class="hero-intro">${e(data.pages.about)}</p><div class="hero-actions"><a class="button primary" href="#research">Explore our research ${arrow}</a><a class="text-link" href="#people">Meet the team <span>↓</span></a></div></div><div class="hero-visual"><div class="orbit orbit-one"><span></span></div><div class="orbit orbit-two"><span></span></div><div class="orbit orbit-three"><span></span></div><div class="core"><b>01</b><small>Observe</small></div><div class="data-note note-a"><b>2.4×</b><small>signal resolution</small></div><div class="data-note note-b"><b>12</b><small>active studies</small></div></div></section>
<section class="signal-strip"><span>Systems biology</span><i></i><span>Spatial dynamics</span><i></i><span>Open science</span><i></i><span>Human health</span></section>
<section class="section research" id="research"><div class="section-heading"><div><p class="section-number">01 — Research</p><h2>Questions that move<br>between scales.</h2></div><p>${e(data.pages.research)}</p></div><div class="research-grid">${research}</div></section>
<section class="section people" id="people"><div class="section-heading compact"><div><p class="section-number">02 — People</p><h2>Curious minds,<br>shared momentum.</h2></div><p>${e(data.pages.people)}</p></div><div class="people-grid">${members}</div></section>
<section class="section publications" id="publications"><div class="section-heading compact"><div><p class="section-number">03 — Selected publications</p><h2>Recent work.</h2></div><p>Representative papers from the lab. Edit them in <code>content/publications.json</code>.</p></div><div class="publication-list">${publications}</div></section>
<section class="join" id="join"><p class="section-number">04 — Join us</p><div><h2>Bring your questions.<br><em>Build the answer with us.</em></h2><p>${e(data.pages.join)}</p><a class="button light" href="mailto:${e(data.lab.email)}">Start a conversation ${arrow}</a></div></section>
<footer><div class="brand footer-brand">${mark}<span>${e(data.lab.name)}</span></div><p>${e(data.lab.location)}<br><a href="mailto:${e(data.lab.email)}">${e(data.lab.email)}</a></p><p class="edit-note">Built to be edited from simple files.<br>© ${new Date().getFullYear()} ${e(data.lab.shortName)}</p></footer>
</main></body></html>`;
await writeFile(join(docs, "index.html"), html);
console.log("GitHub Pages site created in docs/.");
