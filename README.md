# pixl8 — issue tracker + landing page

This repo doesn't contain the app's source. It hosts:

- **`docs/`** — GitHub Pages site for [macs75.github.io/pixl8](https://macs75.github.io/pixl8/).
  Plain HTML + Tailwind via CDN, no build step. Edit, commit, push, live in
  ~30 seconds.
- **Issues** — bug reports and feature requests for the Android app.

The application source itself lives in a separate private repository.

## Site layout

```
docs/
├── index.html         landing / marketing page
├── privacy.html       privacy policy (linked from the Play Store listing)
├── terms.html         terms of use
├── .nojekyll          skip GitHub's Jekyll build — pages are plain HTML
└── assets/            images, favicon, OG cards
```

## Local preview

```sh
cd docs && python3 -m http.server 8000
# open http://localhost:8000
```

## Pages configuration

In repo Settings → Pages, set the source to **`main`** branch, folder
**`/docs`**. GitHub serves `docs/index.html` at the root of the site URL.
