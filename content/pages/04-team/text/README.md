# Team member details

**One file per person.** The filename must match that person's photo in
[`../photos/`](../photos).

```text
photos/04-anna-t-varghese.jpg
text/04-anna-t-varghese.txt      <- same name, different extension
```

Copy this and edit it:

```text
name: Anna T. Varghese
role: PhD Student
email: anna@rgcb.res.in
focus: One line about what you work on

Write your biography here. A short paragraph is plenty. Leave a blank line
between paragraphs.
```

Only `name:` really matters. Leave out any line you do not want.

## Adding your own profile links

Add any of these lines and a small button appears on your card. **Leave a line
out and nothing is shown — no gap, no placeholder.** Only your own card is
affected.

```text
orcid: 0000-0002-1825-0097
scholar: https://scholar.google.com/citations?user=YOURID
researchgate: Your-Profile-Name
pubmed: Harikumar KB[Author]
linkedin: your-name
github: yourusername
website: https://your-site.example
```

Either form works: paste the full web address, or just the ID. Both end up at
the right place. The line can also go at the **bottom** of the file, under your
biography — wherever you happen to be typing is fine.

## Giving yourself a page of your own

Add one line to your file:

```text
profile: yes
```

Your photo and your name on the team page become links to a page that is just
about you. **Nobody gets one of these until they ask for it**, so a page with
nothing on it can never appear.

### What goes on that page

Anything you write under a `## Heading` in your own file. Everything **above**
the first heading stays on your card, so the team page keeps its shape however
long your CV becomes.

```text
name: Your Name
role: PhD Student
profile: yes

A short paragraph. This is what the team page shows.

## Education

PhD Biochemistry, 2024 — Rajiv Gandhi Centre for Biotechnology
M.Sc Biochemistry, 2018 — University of Kerala

## Previous positions

Project Assistant — Some Institute, 2018-2020

## Conferences

- EACR Annual Congress, Rotterdam, 2024 — poster
- Indian Association for Cancer Research, Kochi, 2023 — talk
```

Name the headings whatever you like: `## Awards`, `## Work experience`,
`## Teaching`, `## Collaborations`. They appear in the order you write them.

### Two-column lists

A line written as **`term — detail`** — a year, a dash, then what happened —
becomes a two-column row, which is what makes a CV readable:

```text
2015 — Travel award, ASBMB annual meeting, Washington D.C.
2012-2017 — Ramalingaswami re-entry fellowship, DBT
```

Pasting a CV straight out of a document works too, as long as there is a **blank
line between entries**:

```text
Scientist F
Rajiv Gandhi Centre for Biotechnology

Post doctoral Associate
Virginia Commonwealth University, Richmond, USA
```

Anything that is neither of those — paragraphs, bullet lists — is shown as
ordinary text, exactly as you wrote it.

### Your publications

**They appear on their own.** Every paper on the publications page that lists
you as an author is shown on your page, grouped by year, so there is no second
list to keep up to date.

If your surname is a common one and papers appear that are not yours, list your
own by DOI instead:

```text
papers: 10.3390/biom11050661, 10.1016/j.jare.2023.12.013
```

And to leave publications off your page altogether:

```text
publications: no
```

## The order people appear in

The number at the front of the filename. `01-` is first. The principal
investigator is shown separately at the top automatically.

## The sections on the team page

**The team page sorts itself from your `role:` line.** You do not maintain a
list anywhere — write the right role and the person lands in the right section.

| Section | Roles that go there |
| --- | --- |
| Research scholars | PhD student, doctoral, JRF, SRF, research fellow, project associate, postdoc |
| Technical staff | Technical manager, technical officer, technical assistant, technician |
| Project staff | Project assistant |
| Laboratory support | Lab assistant, lab attendant, support staff |

Note that **Project Assistant** and **Project Associate** are different
sections. They read almost the same, so check which one you have typed.

The numbers on the filenames still set the order *within* a section.

The **home page shows only the research scholars.** Everyone appears in full on
the team page.

If a role does not match any row above, that person is still shown — in a final
section called `Team` — so nobody ever disappears. To place them deliberately,
add a `group:` line with the section name:

```text
name: Someone
role: Visiting Fellow
group: Research scholars
```

## Removing someone

Delete both their files.
