# Gallery photos

**Drop photos in. That is the whole job.** No text file needed.

Order is by filename, so use `01-`, `02-` if you want a particular sequence.

Accepted: `.jpg` `.jpeg` `.png` `.webp` `.svg` `.gif`

Upload full-size photos — they are resized automatically when the site builds,
so the page stays fast even with fifty or more images. Visitors can click any
photo to see it full screen.

## Albums

**A folder in here is an album.** Photos that sit loose in `photos/` show up as
one plain grid; anything inside a folder becomes a stack of prints on the page
that opens to reveal the photos inside it.

```text
photos/
  01-christmas-2026/      ← an album, titled "Christmas 2026"
    01-dinner.jpg
    02-tree.jpg
  02-eacr-conference/     ← another one
    poster-session.jpg
  39.jpg                  ← loose photos still work, shown under "More photos"
```

The folder name becomes the album title, so name folders the way you want them
read: `phd-defences-2026` shows as "Phd defences 2026". The `01-` at the front
sets the order and is not shown.

### Naming an album properly (optional)

For a better title than the folder name, add `album.txt` **inside the album
folder**:

```text
title: Christmas 2026
date: December 2026
cover: 04-cake.jpg
caption: Secret Santa, cake, and the annual group photo.
```

Every line is optional:

| Line | What it does |
| --- | --- |
| `title:` | The album name. Defaults to the folder name. |
| `date:` | A line under the title. Free text — write it however you like. |
| `cover:` | Which photo sits on top of the stack. Defaults to the first one. |
| `caption:` | A sentence describing the album. |

## Captions (optional)

For a photo in an album, put a text file **next to it, in the same folder**,
named after the photo:

```text
photos/01-christmas-2026/02-tree.jpg
photos/01-christmas-2026/02-tree.txt
```

For a loose photo, the caption goes in [`../text/`](../text) instead:

```text
photos/07-lab-retreat-2025.jpg
text/07-lab-retreat-2025.txt
```

Either way the file contains just the caption text. Photos without one simply
have no caption.

## If something is wrong

Nothing here can break the site. An album folder with no photos in it is left
out and reported by `npm run check`; a photo that cannot be read is skipped and
the rest of the album still publishes.
