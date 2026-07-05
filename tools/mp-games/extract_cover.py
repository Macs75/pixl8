#!/usr/bin/env python3
"""Make a clean cover image for the mp-games gallery from a cart's .p8.png.

A .p8.png hides the cart's code in the low 2 bits of every channel. We mask those
off, leaving just the visible label art — so the site hosts a cover thumbnail,
NOT the game (no redistribution).

Usage:
  extract_cover.py <cart.p8.png> <out.png>
  # out name should be the cart's pid (the mp-games.json "pid"), e.g. bubblebobble.png
  # then drop it in docs/assets/mp-games/ and add the entry to docs/mp-games.json.
"""
import sys
from PIL import Image

img = Image.open(sys.argv[1]).convert("RGBA")
img.point(lambda p: p & 0xFC).convert("RGB").save(sys.argv[2], "PNG", optimize=True)
print("wrote", sys.argv[2])
