/**
 * Responsive image generation.
 *
 * Lab members upload straight from a phone, so a single gallery page can easily
 * carry 50 photos at several megabytes each. Every image is therefore resized
 * into a handful of widths and served with `srcset`.
 *
 * Two robustness decisions worth knowing about:
 *
 *  - `sharp` is a native module. If it fails to load on someone's machine the
 *    build does not die; images are copied through untouched and a warning is
 *    recorded. A heavy site beats a broken one.
 *  - Generated files are cached in `.cache/images/` keyed by a hash of the
 *    source bytes, so rebuilding after a text edit re-encodes nothing.
 */

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, posix } from "node:path";
import type { Img, Warning } from "./types.ts";

/**
 * Widths generated for each image, filtered to those below the original.
 *
 * 2400 exists for banners: they are served at `sizes="100vw"`, so on a wide
 * high-density screen the browser wants roughly twice the CSS width and would
 * otherwise have to upscale the 1800 variant. Only sources big enough to supply
 * it get one, so nothing is invented and small images cost nothing.
 */
const WIDTHS = [480, 800, 1200, 1800, 2400];

/** Formats we resize. Anything else is copied through as-is. */
const RASTER = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);
/** Formats we accept but never touch (vector, animated). */
const PASSTHROUGH = new Set([".svg", ".gif", ".avif"]);

export const IMAGE_EXTENSIONS = [...RASTER, ...PASSTHROUGH];

/**
 * What an input format is published as.
 *
 * TIFF is the only one that changes. Microscopes and slide scanners produce it
 * by the gigabyte and people quite reasonably drop those files straight into a
 * folder — but no browser can display TIFF, so publishing one unchanged means
 * publishing a broken image. It is re-encoded as JPEG on the way out instead.
 * Everything else keeps its own format.
 */
function outputExtension(ext: string): string {
  return ext === ".tif" || ext === ".tiff" ? ".jpg" : ext;
}

export function isImage(filename: string): boolean {
  return IMAGE_EXTENSIONS.includes(extname(filename).toLowerCase());
}

/** List image files in a directory, or nothing if the directory is absent. */
export async function listImages(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && isImage(entry.name) && !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  } catch {
    return [];
  }
}

type CacheEntry = {
  width: number;
  height: number;
  files: { width: number; name: string }[];
};

/** The callable factory, not the module namespace. */
type SharpFactory = (typeof import("sharp"))["default"];

export type ImagePipeline = {
  /**
   * Generate variants for one source image.
   *
   * @param relDir Directory under `assets/` to place output in, e.g. `team`.
   * @returns The image, or null if the file could not be read at all.
   */
  process(srcPath: string, relDir: string, alt: string): Promise<Img | null>;
  warnings: Warning[];
};

export async function createImagePipeline(options: {
  outRoot: string;
  cacheRoot: string;
}): Promise<ImagePipeline> {
  const { outRoot, cacheRoot } = options;
  const cacheDir = join(cacheRoot, "images");
  const indexPath = join(cacheRoot, "images.json");
  const warnings: Warning[] = [];

  await mkdir(cacheDir, { recursive: true });

  let index: Record<string, CacheEntry> = {};
  try {
    index = JSON.parse(await readFile(indexPath, "utf8")) as Record<string, CacheEntry>;
  } catch {
    index = {};
  }

  let sharp: SharpFactory | null = null;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    warnings.push({
      file: "package.json",
      message: "The `sharp` image library could not be loaded, so images were not resized.",
      fallback: "Images are published at their original size. Run `npm install` to fix this.",
    });
  }

  let dirty = false;

  async function build(srcPath: string, bytes: Buffer, key: string): Promise<CacheEntry> {
    const ext = extname(srcPath).toLowerCase();
    const base = key.slice(0, 16);

    if (!sharp || !RASTER.has(ext)) {
      const name = `${base}${ext}`;
      await writeFile(join(cacheDir, name), bytes);
      let width = 0;
      let height = 0;
      if (sharp) {
        try {
          const meta = await sharp(bytes).metadata();
          width = meta.width ?? 0;
          height = meta.height ?? 0;
        } catch {
          /* Dimensions are a nicety; the image still renders without them. */
        }
      }
      return { width, height, files: [{ width, name }] };
    }

    const image = sharp(bytes, { failOn: "none" });
    const meta = await image.metadata();
    const originalWidth = meta.width ?? 0;
    const originalHeight = meta.height ?? 0;

    // Never upscale: only widths the source can actually supply, plus the
    // original itself when it is smaller than our smallest step.
    const targets = WIDTHS.filter((width) => width < originalWidth);
    if (originalWidth > 0) targets.push(Math.min(originalWidth, WIDTHS[WIDTHS.length - 1]!));

    const outExt = outputExtension(ext);

    const files: { width: number; name: string }[] = [];
    for (const width of [...new Set(targets)].sort((a, b) => a - b)) {
      const name = `${base}-${width}${outExt}`;
      const pipeline = sharp(bytes, { failOn: "none" })
        .rotate() // Honour EXIF orientation, or phone photos arrive sideways.
        .resize({ width, withoutEnlargement: true });
      const encoded =
        outExt === ".png"
          ? await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
          : outExt === ".webp"
            ? await pipeline.webp({ quality: 82 }).toBuffer()
            : await pipeline
                // JPEG has no alpha. A transparent TIFF would otherwise come
                // out with black behind it rather than white.
                .flatten({ background: "#ffffff" })
                .jpeg({ quality: 82, mozjpeg: true, progressive: true })
                .toBuffer();
      await writeFile(join(cacheDir, name), encoded);
      files.push({ width, name });
    }

    const largest = files[files.length - 1]?.width ?? originalWidth;
    const height =
      originalWidth > 0 && largest > 0
        ? Math.round((originalHeight * largest) / originalWidth)
        : originalHeight;

    return { width: largest, height, files };
  }

  return {
    warnings,
    async process(srcPath, relDir, alt) {
      let bytes: Buffer;
      try {
        bytes = await readFile(srcPath);
      } catch {
        warnings.push({
          file: srcPath,
          message: "Image could not be read.",
          fallback: "It was left out of the site.",
        });
        return null;
      }

      const key = createHash("sha1").update(bytes).digest("hex");
      let entry = index[key];

      if (!entry || !entry.files.every((file) => existsSync(join(cacheDir, file.name)))) {
        try {
          entry = await build(srcPath, bytes, key);
          index[key] = entry;
          dirty = true;
        } catch {
          warnings.push({
            file: srcPath,
            message: "Image could not be processed — it may be corrupt or an unsupported format.",
            fallback: "It was left out of the site.",
          });
          return null;
        }
      }

      const destDir = join(outRoot, "assets", relDir);
      await mkdir(destDir, { recursive: true });
      for (const file of entry.files) {
        await copyFile(join(cacheDir, file.name), join(destDir, file.name));
      }

      if (dirty) {
        await writeFile(indexPath, JSON.stringify(index, null, 2));
        dirty = false;
      }

      const urlFor = (name: string) => posix.join("assets", relDir.split(/[\\/]/).join("/"), name);
      const last = entry.files[entry.files.length - 1]!;

      return {
        src: urlFor(last.name),
        width: entry.width,
        height: entry.height,
        // A lone variant needs no srcset; the browser has no choice to make.
        srcset:
          entry.files.length > 1
            ? entry.files.map((file) => `${urlFor(file.name)} ${file.width}w`).join(", ")
            : "",
        alt,
      };
    },
  };
}
