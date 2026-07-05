# mp-games — curated multiplayer list

The **Multiplayer games** page (`docs/mp-games.html`) is a gallery of two-player
PICO-8 carts, each linking to its Lexaloffle BBS page (users download from the
author — Pixl8 hosts no carts).

## Editing the list

The list lives in a JSON block **inside `docs/mp-games.html`** —
`<script type="application/json" id="mpGames">…</script>`. Edit that block; the
page reads it inline, so it works from `file://` too (no server, no CORS). Each
entry:

```json
{
  "file":   "bubblebobble-1.p8.png",   // informational (source cart file)
  "pid":    "bubblebobble",            // BBS slug AND cover filename
  "title":  "Bubble Bobble 0.8",       // shown on the card
  "author": "pahammond",               // shown under the title (optional)
  "bbs":    "https://www.lexaloffle.com/bbs/?pid=bubblebobble"
}
```

- **Remove** an entry: delete its object (and optionally its cover PNG).
- **Add** an entry: append an object + drop a cover at
  `docs/assets/mp-games/<pid>.png`.
- **Fix** a title/author: just edit the string.

The initial list was seeded from the 2-player-flagged carts on the test devices;
titles/authors without a `.nfo` were guessed from the filename and need cleanup.

## Making a cover

Covers are the cart's own label art with the hidden cart code masked off:

```sh
python3 extract_cover.py /path/to/game.p8.png ../../docs/assets/mp-games/<pid>.png
```

Requires Pillow (`pip install pillow`). Covers are 160×205; the page renders them
`image-rendering: pixelated`.
