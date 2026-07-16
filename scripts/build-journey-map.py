#!/usr/bin/env python3
"""Composite the Journey world maps from Oleg's art pieces.
Layers: ocean background -> stepping-stone paths -> 5 chapter islands -> decoration.
Outputs public/assets/campaign/world-map.webp (desktop 16:9) and world-map-mobile.webp (tall portrait).
Coordinates are FRACTIONS of the canvas (0..1): (cx, cy) = piece center, w = piece width / canvas width.
Tune the tables below against public/assets/journey/Как оно должно выглядеть*.png until the layout matches."""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = os.path.join(ROOT, 'public/assets/journey')
OUT = os.path.join(ROOT, 'public/assets/campaign')


def load(rel):
    return Image.open(os.path.join(J, rel)).convert('RGBA')


def place(canvas, piece, cx, cy, wfrac):
    """Scale piece to wfrac*canvas_width, paste centered at (cx,cy) fractions, respecting alpha."""
    W, H = canvas.size
    tw = max(1, int(wfrac * W))
    th = max(1, round(piece.height * tw / piece.width))
    p = piece.resize((tw, th), Image.LANCZOS)
    x = int(cx * W) - tw // 2
    y = int(cy * H) - th // 2
    canvas.alpha_composite(p, (x, y))


# ---- DESKTOP (1920x1080) ----
DESK_BG = 'journey_background/journey_bg.webp'
DESK_PATHS = [  # (file, cx, cy, wfrac) — behind islands
    ('path/path1.webp', 0.50, 0.19, 0.34),   # lagoon -> lava (top S-curve)
    ('path/path2.webp', 0.80, 0.51, 0.06),   # lava -> reef (right, vertical)
    ('path/path3.webp', 0.50, 0.83, 0.30),   # reef -> arctic (bottom)
    ('path/path4.webp', 0.38, 0.64, 0.10),   # arctic -> abyss
]
DESK_ISLANDS = [  # (file, cx, cy, wfrac)
    ('journey_big_island/NormIsland_journey.webp', 0.23, 0.28, 0.25),  # lagoon
    ('journey_big_island/Lava_journey.webp',       0.77, 0.26, 0.30),  # volcano
    ('journey_big_island/Reef_journey.webp',       0.78, 0.76, 0.30),  # reef
    ('journey_big_island/Arctic_journey.webp',     0.24, 0.77, 0.26),  # arctic
    ('journey_big_island/Abyss_journey.webp',      0.51, 0.52, 0.26),  # abyss (grotto)
]
DESK_DECOR = [
    ('small_island/small_island_1.webp', 0.36, 0.13, 0.08),
    ('small_island/small_island_3.webp', 0.63, 0.14, 0.11),  # big volcano near lava
    ('small_island/small_island_4.webp', 0.82, 0.44, 0.06),  # small volcano
    ('small_island/small_island_5.webp', 0.52, 0.90, 0.09),  # rock spire
    ('small_island/small_island_6.webp', 0.11, 0.57, 0.08),  # ice floe
    ('small_island/small_island_7.webp', 0.31, 0.90, 0.10),  # ice floe near arctic
    ('small_island/small_island_2.webp', 0.09, 0.42, 0.08),  # rocks
]

# ---- MOBILE (1209x5679) ----
MOB_BG = 'journey_background/journey_background_mobile1.webp'
MOB_PATHS = [
    ('path/path1_mobile.webp', 0.50, 0.185, 0.14),
    ('path/path2_mobile.webp', 0.50, 0.395, 0.17),
    ('path/path1_mobile.webp', 0.50, 0.605, 0.14),
    ('path/path2_mobile.webp', 0.50, 0.815, 0.17),
]
MOB_ISLANDS = [
    ('journey_big_island/NormIsland_journey.webp', 0.50, 0.08, 0.55),
    ('journey_big_island/Lava_journey.webp',       0.50, 0.29, 0.66),
    ('journey_big_island/Reef_journey.webp',       0.50, 0.50, 0.62),
    ('journey_big_island/Arctic_journey.webp',     0.50, 0.71, 0.55),
    ('journey_big_island/Abyss_journey.webp',      0.50, 0.92, 0.58),
]
MOB_DECOR = [
    ('small_island/small_island_1.webp', 0.80, 0.05, 0.14),
    ('small_island/small_island_3.webp', 0.80, 0.20, 0.16),  # volcano near lava
    ('small_island/small_island_5.webp', 0.80, 0.60, 0.14),  # rock near reef
    ('small_island/small_island_6.webp', 0.18, 0.63, 0.14),  # ice near arctic
    ('small_island/small_island_7.webp', 0.80, 0.80, 0.16),  # ice
]


def build(size, bg, paths, islands, decor, out_name, quality=85):
    canvas = Image.new('RGBA', size, (0, 0, 0, 0))
    base = load(bg).resize(size, Image.LANCZOS)
    canvas.alpha_composite(base)
    for f, cx, cy, w in paths + islands + decor:
        place(canvas, load(f), cx, cy, w)
    dst = os.path.join(OUT, out_name)
    canvas.convert('RGB').save(dst, 'WEBP', quality=quality, method=6)
    print(f"wrote {dst} {size[0]}x{size[1]} ({os.path.getsize(dst) // 1024} KB)")


build((1920, 1080), DESK_BG, DESK_PATHS, DESK_ISLANDS, DESK_DECOR, 'world-map.webp', quality=85)
build((1209, 5679), MOB_BG, MOB_PATHS, MOB_ISLANDS, MOB_DECOR, 'world-map-mobile.webp', quality=80)
print("done")
