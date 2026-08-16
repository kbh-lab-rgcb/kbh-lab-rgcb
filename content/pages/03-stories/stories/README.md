# Research stories

**Each file here becomes one research story**, and each story appears twice: in
full on this page, and as a card on the home page. You do not have to do
anything to make the home page card appear — adding the file is the whole job.

## Adding a story

Create a file named like `05-my-new-story.txt` and fill it in:

```text
title: The headline, written as a sentence
tag: Topic · Second topic
lead: One sentence saying what the work found. This is the line printed under
  the headline in larger type.
why: Why it matters, in a sentence or two. Printed as a small panel at the end
  of the story.
excerpt: The short version, used on the home page card. Two sentences at most.
papers: 10.3390/biom11050661, 10.1038/s41598-017-14253-8

The background research, in paragraphs. Leave a blank line between paragraphs.

You can use **bold**, *italic*, [links](https://example.com) and bullet lists,
the same as anywhere else on the site.
```

The blank line matters: everything above it is settings, everything below it is
the story.

## The lines you can use

| Line | What it does |
| --- | --- |
| `title:` | The headline. Without it, the file name is used. |
| `tag:` | A small line above the headline, for the topic. |
| `lead:` | One sentence under the headline, in larger type. |
| `why:` | A short "Why it matters" panel at the end of the story. |
| `excerpt:` | The card text on the home page. |
| `papers:` | The DOIs of the papers behind the story — see below. |
| `home: no` | Keeps this story off the home page. |
| `caption:` | The caption for the picture, if this story has one. |

**Every line is optional except the story itself.** Leave one out and that part
is simply not printed — no gap, no placeholder. A file with a `title:` and two
paragraphs is a perfectly good story, so it is fine to add the rest later.

If a line is too long for your window and wraps onto the next line, **indent the
continuation** by a space or two, as `lead:` does in the example above. That
tells the site the sentence is still going.

## Papers

List the DOI of each paper, separated by commas. A DOI looks like
`10.3390/biom11050661`, and you can paste it in any of the forms you are likely
to have copied:

```text
papers: 10.3390/biom11050661
papers: doi:10.3390/biom11050661, 10.7150/thno.25308
papers: https://doi.org/10.3390/biom11050661
```

You do not type the citation itself. The site looks the DOI up in
`content/pages/06-publications/years/` and prints the citation exactly as it
appears on the publications page, with the DOI and PubMed buttons. That way a
paper is written out once on the whole site, and correcting it there corrects it
everywhere.

**So add the paper to the publications page first.** If a DOI is not listed
there yet, the story still publishes — it just shows the bare DOI with a link,
and the build report tells you which paper to add.

## Pictures

Put the picture in [`../figures/`](../figures/) with **the same name** as the
story:

```text
stories/05-my-new-story.txt
figures/05-my-new-story.jpg
```

The picture then sits beside the opening of the story, with the writing running
on beneath it — and it becomes the background of that story's card on the home
page. A story without one still works: the story runs full width and its card
stays plain.

## Ordering

The `05-` at the front sets the order on the page and is not shown to visitors.
To move a story, change its number.

## Removing a story

Delete its file. It disappears from both pages.
