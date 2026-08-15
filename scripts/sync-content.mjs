import { readFile, readdir, mkdir, copyFile, writeFile } from "node:fs/promises";
import { extname, basename, join } from "node:path";

const root = process.cwd();
const contentDir = join(root, "content");
const photosDir = join(contentDir, "members", "photos");
const textDir = join(contentDir, "members", "text");
const publicMembers = join(root, "public", "members");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const readText = async (path) => (await readFile(path, "utf8")).trim();

function parseMember(raw, slug) {
  const [header = "", ...body] = raw.split(/\r?\n\r?\n/);
  const fields = Object.fromEntries(header.split(/\r?\n/).map((line) => {
    const index = line.indexOf(":");
    return index > -1 ? [line.slice(0, index).trim(), line.slice(index + 1).trim()] : ["", ""];
  }).filter(([key]) => key));
  return { slug, name: fields.name || slug, role: fields.role || "Lab member", email: fields.email || "", bio: body.join("\n\n").trim() };
}

const photoFiles = (await readdir(photosDir)).filter((file) => [".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(extname(file).toLowerCase())).sort();
await mkdir(publicMembers, { recursive: true });
const members = [];
for (const photoFile of photoFiles) {
  const slug = basename(photoFile, extname(photoFile));
  const textPath = join(textDir, `${slug}.txt`);
  let raw;
  try { raw = await readText(textPath); } catch { throw new Error(`Missing matching member file: content/members/text/${slug}.txt`); }
  await copyFile(join(photosDir, photoFile), join(publicMembers, photoFile));
  members.push({ ...parseMember(raw, slug), photo: `/members/${photoFile}` });
}

const pageNames = ["about", "research", "people", "join"];
const pages = Object.fromEntries(await Promise.all(pageNames.map(async (name) => [name, await readText(join(contentDir, "pages", `${name}.txt`))])));
const data = {
  lab: await readJson(join(contentDir, "site.json")),
  pages,
  research: await readJson(join(contentDir, "research.json")),
  publications: await readJson(join(contentDir, "publications.json")),
  members,
};

await writeFile(join(root, "app", "content.generated.ts"), `const content = ${JSON.stringify(data, null, 2)} as const;\nexport default content;\n`);
await writeFile(join(root, "content.generated.json"), `${JSON.stringify(data, null, 2)}\n`);
console.log(`Synced ${members.length} member profiles.`);
