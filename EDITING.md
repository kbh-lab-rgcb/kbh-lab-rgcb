# How to update the website

You do not need to install anything, and you do not need to know any code.
Everything on the site comes from files in the [`content/`](content/) folder, and
you can change them from your browser.

After you save a change, the site rebuilds itself and goes live in about two
minutes.

---

## The one rule worth learning

**A photo and its text file share the same name.**

```text
content/pages/03-team/photos/04-anna-t-varghese.jpg
content/pages/03-team/text/04-anna-t-varghese.txt
```

Same name, different folder. That is how the site knows which text belongs to
which photo. The `04-` at the front controls the order and is not shown to
visitors.

The same idea is used everywhere: figures pair with text sections, gallery
captions pair with gallery photos.

---

## Editing text from your browser

1. Go to the file on GitHub — for example
   `content/pages/02-research/text/01-overview.txt`.
2. Click the **pencil** icon (top right of the file).
3. Make your changes.
4. Scroll down, type a short note about what you changed, and click
   **Commit changes**.

That is it. Wait a couple of minutes and refresh the website.

## Uploading a photo

1. Open the folder you want to add to — for example
   `content/pages/06-gallery/photos/`.
2. Click **Add file → Upload files**.
3. Drag your photos in.
4. Click **Commit changes**.

Upload the full-size original. Photos are resized automatically, so you do not
need to shrink them first.

## Creating a new file

1. Open the folder.
2. Click **Add file → Create new file**.
3. Type the filename, including `.txt` — for example `08-new-member.txt`.
4. Type the contents.
5. Click **Commit changes**.

---

## Common jobs

### Add a new lab member

Two files, same name:

- Upload their photo to `content/pages/03-team/photos/` as, say,
  `08-new-person.jpg`
- Create `content/pages/03-team/text/08-new-person.txt` containing:

```text
name: New Person
role: PhD Student
email: newperson@rgcb.res.in
focus: What they work on, in one line

A short paragraph about their background and research.
```

**You can do these in either order.** A photo with no text file still shows the
person, and a text file with no photo shows their initials. Nothing breaks
halfway through.

### Add your ORCID, Google Scholar or ResearchGate

Add a line to your own text file:

```text
orcid: 0000-0002-1825-0097
scholar: https://scholar.google.com/citations?user=YOURID
researchgate: Your-Profile-Name
```

A small button appears on your card. **If you leave a line out, nothing shows —
no empty space.** Nobody else's card is affected.

Two things that make this hard to get wrong:

- You can paste the **full web address or just the ID** — both end up in the
  right place.
- The line works **at the top with the other settings or at the bottom under
  your biography**. Adding it wherever you happen to be typing is fine.

### Add a research story

A research story is a longer piece about one line of work, with the papers
behind it. It appears in full on the research page **and as a card on the home
page** — you only write it once.

Create a file in `content/pages/02-research/stories/`, named with the next
number, such as `06-my-new-story.txt`:

```text
title: The headline, written as a sentence
tag: Topic · Second topic
lead: One sentence saying what the work found.
why: Why it matters, in a sentence or two.
excerpt: The short version, used on the home page card.
papers: 10.3390/biom11050661

The background research, in paragraphs.
```

You give the **DOI** of each paper, not the citation — the site prints the
citation from the publications page, so it is written out once and stays in
step. Add the paper there first.

Every line except the story itself is optional; leave one out and that part is
simply not shown. `content/pages/02-research/stories/README.md` explains each
line in full.

### Add a publication

Open `content/pages/05-publications/years/` and edit the file for that year, or
create it (`2026.txt`). Paste the citation, leaving a blank line between papers,
and add the identifier at the end:

```text
Author A, Author B, Harikumar KB. Title of the paper. Journal Name.
2026;12(3):45-67. pmid:12345678 doi:10.1234/example
```

The DOI and PubMed buttons appear on their own. If you do not have an
identifier, leave it out — the paper still lists, just without a button.

### Change a page's banner

Put an image in that page's `banner/` folder. One image gives a still banner;
**two or more turn into a slideshow automatically.**

### Move a page in the menu

Rename its folder. `05-publications` → `02-publications` moves it up.

### Add a whole new page

Create a folder under `content/pages/`, such as `09-facilities`, with a
`banner/` folder and a `text/` folder inside. The page and its menu link appear
on their own.

---

## If something looks wrong

**The site will not break because of a content mistake.** Missing files, empty
files and unmatched photos all produce a sensible fallback rather than an error.

To see what the site made of your files, open the **Actions** tab on GitHub and
look at the most recent run. Anything it could not use is listed there, with the
file name and what it did instead.

If the page still looks wrong after two minutes, check that:

- the filename matches its partner exactly (including the `04-` prefix)
- the file ends in `.txt`, not `.txt.txt` or `.docx`
- there is a **blank line** between the `key: value` lines and the body text

---

## Previewing on your own computer (optional)

Only needed if you want to see changes before they go live.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. Edit any file in `content/` and the page
reloads by itself.

To see a report of what the site can and cannot read from your files:

```bash
npm run check
```
