# The content folder

**Everything on the website comes from this folder.** Change a file here, commit
it, and the site rebuilds and republishes itself in a couple of minutes.

You never need to touch any code.

| I want to… | Go to |
| --- | --- |
| Change the lab name, address, phone or email | [`site.json`](site.json) |
| Change what a page says | `pages/<page>/text/` |
| Change a page's banner image | `pages/<page>/banner/` |
| Add or remove a lab member | `pages/04-team/photos/` and `pages/04-team/text/` |
| Add an alumnus | `pages/05-alumni/text/` |
| Add a publication | `pages/06-publications/years/` |
| Add gallery photos or an album | `pages/07-gallery/photos/` |
| Add an outgoing link | `pages/09-links/links/` |

## The names in `site.json`

Three of them, and they do different jobs:

| Line | Where it shows |
| --- | --- |
| `labName` | The heading on the home page, and the browser tab — `KBH Lab` |
| `name` | Above that heading, in the footer, and in link previews — the programme's full name |
| `shortName` | The badge in the header, and after every other page's title — `CRP7` |

Leave `labName` out and the home page leads with `name`, exactly as it did
before the lab had a name of its own.

Each folder has its own README explaining what to put in it. Open the folder on
GitHub and you will see the instructions.

See [EDITING.md](../EDITING.md) for a step-by-step walkthrough.
