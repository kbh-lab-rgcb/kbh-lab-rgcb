/**
 * Local preview with live reload: `npm run dev`.
 *
 * Watches `content/` and `src/`, rebuilds on change, and pushes a reload to the
 * browser over Server-Sent Events. Deliberately dependency-free — this is the
 * loop an editor uses to check their change, so it must always start.
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { watch } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { buildSite, reportWarnings } from "../src/build.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = join(root, "docs");
const port = Number(process.env.PORT ?? 3000);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

const clients = new Set<import("node:http").ServerResponse>();
let building: Promise<void> = Promise.resolve();

async function rebuild(reason: string): Promise<void> {
  try {
    const result = await buildSite({ root, liveReload: true });
    console.log(`${reason} → rebuilt ${result.pageCount} pages in ${result.ms}ms`);
    reportWarnings(result.warnings);
    for (const client of clients) client.write("data: reload\n\n");
  } catch (error) {
    // A crash here is a bug in the generator, not in someone's content —
    // keep the server alive so the next save can recover.
    console.error("Build failed:", error);
  }
}

await rebuild("Initial build");

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);

  if (url.pathname === "/__reload") {
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    response.write("retry: 500\n\n");
    clients.add(response);
    request.on("close", () => clients.delete(response));
    return;
  }

  await building;

  // Resolve inside docs/ only; a `..` in the path must not escape it.
  const requested = decodeURIComponent(url.pathname);
  let filePath = resolve(outRoot, `.${normalize(requested)}`);
  if (!filePath.startsWith(outRoot + sep) && filePath !== outRoot) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const info = await stat(filePath).catch(() => null);
    if (!info || info.isDirectory()) filePath = join(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    response.end("<h1>404</h1><p>Not found. Check the page folder name in content/pages/.</p>");
  }
});

server.listen(port, () => {
  console.log(`\n  Preview:  http://localhost:${port}\n  Watching: content/ and src/\n`);
});

let pending: NodeJS.Timeout | undefined;
function scheduleRebuild(reason: string): void {
  clearTimeout(pending);
  // Editors save in bursts and image copies land as several events; coalesce.
  pending = setTimeout(() => {
    building = rebuild(reason);
  }, 120);
}

watch(join(root, "content"), { recursive: true }, (_event, filename) => {
  if (filename && !String(filename).includes(".cache")) scheduleRebuild(`content/${filename}`);
});

/**
 * Editing the generator itself needs a full restart.
 *
 * Node caches ES modules for the life of the process, so a rebuild would
 * silently keep running the old code — a genuinely confusing trap. Respawning
 * is the honest fix.
 */
let restarting = false;
watch(join(root, "src"), { recursive: true }, (_event, filename) => {
  if (!filename || restarting) return;
  restarting = true;
  console.log(`\nsrc/${filename} changed — restarting the generator…\n`);
  for (const client of clients) client.end();
  server.closeAllConnections();
  server.close(() => {
    spawn(process.execPath, [...process.execArgv, ...process.argv.slice(1)], {
      stdio: "inherit",
    }).on("exit", (code) => process.exit(code ?? 0));
  });
});
