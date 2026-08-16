# Name lists

**Only for short-term trainees from other institutions** — people who came for
a few weeks, where a card each would swamp the page.

Each file here becomes one collapsible list at the bottom of the alumni page.
Two files sit side by side on a wide screen; more simply wrap.

## Who does NOT go here

| Person | Where they go |
| --- | --- |
| MSc student who did their final project here | a card — `../text/`, `role: MSc` |
| Project associate, SRF or JRF who worked here | a card — `../text/`, `role: Project Associate` |
| PhD student | a card — `../text/`, `role: PhD` |
| Post-doctoral fellow | a card — `../text/`, `role: Post-doctoral Fellow` |

Those four all get their own section of cards on the alumni page, with a photo,
thesis and where they are now. This folder is for the visitors only.

## The format

One person per line, `Name — College`:

```text
title: Trainees from other institutions

Anjali Nair — St Teresa's College, Ernakulam
Rahul Menon — Government College, Kariavattom
```

The `title:` line is what the reader clicks to open the list. Leave it out and
the filename is used instead.

**The separator can be an em dash (—), an en dash (–), a hyphen surrounded by
spaces, or a comma.** Whichever is easiest to type. A line with no separator at
all still works — it is just a name with no college.

Lines starting with `#` are ignored, so you can leave yourself notes.

## Adding another list

Drop in another file. `03-summer-students.txt`, and so on. The number at the
front sets the order.

## People who should get a full card instead

Anyone with a photo, a thesis or a role worth stating belongs in
[`../text/`](../text) as their own file — they then appear in one of the
sections above these lists, sorted by their `role:` line.
