# Editable Lab Website

A polished, file-driven lab website that automatically publishes to GitHub Pages whenever the `main` branch changes.

## Edit the lab information

- `content/site.json` — lab name, headline, location, and email
- `content/pages/*.txt` — text for the About, Research, People, and Join sections
- `content/research.json` — research themes
- `content/publications.json` — publication list

## Add or edit a lab member

Every member uses two files with the **same base filename**:

```text
content/members/photos/samira-khan.jpg
content/members/text/samira-khan.txt
```

The text file format is:

```text
name: Samira Khan
role: Research Assistant
email: samira@example.edu

Write the member biography here. It can be one or more sentences.
```

Photo formats supported: `.jpg`, `.jpeg`, `.png`, `.webp`, and `.svg`. To remove a member, delete both matching files.

## Publish on GitHub Pages

1. Create a GitHub repository and upload this project.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. Push changes to `main`. The included workflow rebuilds and publishes the site automatically.

After setup, editors only need to change files in `content/` through GitHub’s web editor or by pushing changes. The site rebuilds from those files—there is no database or admin panel to maintain.

## Preview locally

```bash
npm install
npm run dev
```

To create the static GitHub Pages output manually:

```bash
npm run build:github
```

The static files will be written to `docs/`.
