# Publications

**One file per year. One paper per paragraph.**

To add a paper published in 2026, open `2026.txt` (or create it), and paste the
citation on its own, with a blank line before it:

```text
Vijayan Y, Sandhu JS, Harikumar KB. Modulatory role of phytochemicals in cancer
immunotherapy. Curr Med Chem. 2024;31(32):5165-5177. pmid:38549529
doi:10.2174/0109298673274796240116105555
```

That is it. The year heading comes from the filename, and years are listed
newest first automatically.

## Linking to the paper

Put any of these anywhere in the entry — usually at the end:

| Write | Becomes |
| --- | --- |
| `doi:10.1016/j.jare.2023.12.013` | a **DOI** button |
| `pmid:38142035` | a **PubMed** button |
| `pmc:PMC1234567` | a **PMC** button |
| `https://…` | a **Full text** button |

You can use more than one; each gets its own button. **If you add none, the
paper simply shows with no button** — nothing looks broken.

The identifiers are removed from the visible citation, so do not worry about how
they look.

## Finding the DOI or PMID

Search the paper on [PubMed](https://pubmed.ncbi.nlm.nih.gov/). The PMID is the
number in the address bar; the DOI is listed on the page.

## Author names in bold

Lab members' surnames are bolded automatically. The list lives under
`labAuthors` in [`content/site.json`](../../../site.json) — add new members
there.

## A citation can wrap

Long citations may run over several lines. Just keep a blank line between one
paper and the next; that blank line is what separates them.
