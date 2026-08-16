# Pages

**One folder here = one page on the website**, in this order, with a matching
link in the navigation bar.

The `01-`, `02-` prefix sets the order and is not shown to visitors. Rename
`05-publications` to `02-publications` and it moves up the menu.

## Adding a new page

Create a folder, and inside it a `banner/` folder and a `text/` folder. That is
all — the page and its nav link appear automatically.

The folder name decides how the page is laid out:

| If the folder name contains… | The page shows |
| --- | --- |
| `home` | the front page, pulling in the PI, recent papers and the team |
| `team`, `people`, `members` | people, from paired photos and text files |
| `alumni` | past members, with thesis and current position |
| `publication`, `papers` | papers grouped by year |
| `gallery`, `photos` | a photo grid with a click-to-enlarge viewer |
| `contact` | the address, phones and emails from `site.json` |
| `link`, `resource` | a grid of outgoing links |
| anything else | plain text sections with optional figures |

Any page can also hold a `stories/` folder of research stories, which appear on
that page and as cards on the home page. The Research stories page is nothing
more than a folder with one of those in it.

So a new folder called `09-facilities` gives you a normal text page with no code
change at all.

## Renaming or deleting a page

Delete the folder to remove the page. Rename it to change its address — but note
that anyone who bookmarked the old address will get a 404.
