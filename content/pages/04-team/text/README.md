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
