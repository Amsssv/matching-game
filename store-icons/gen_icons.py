#!/usr/bin/env python3
"""Generate 512x512 PNG store icons for all Yandex Payments products.
Colors mirror the tints / palettes in src/state/catalog.ts.
Drawn at 4x supersample then downscaled for clean anti-aliasing."""
import math
from PIL import Image, ImageDraw, ImageFilter

S = 512          # final size
SS = 4           # supersample factor
W = S * SS       # work canvas size
OUT = "."        # output dir (run from store-icons/)


def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def lighten(c, t):
    return lerp(c, (255, 255, 255), t)


def darken(c, t):
    return lerp(c, (0, 0, 0), t)


def new_canvas():
    return Image.new("RGBA", (W, W), (0, 0, 0, 0))


def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def vertical_gradient(size, top, bottom):
    grad = Image.new("RGB", (1, size))
    for y in range(size):
        grad.putpixel((0, y), lerp(top, bottom, y / max(1, size - 1)))
    return grad.resize((size, size))


def base_bg(top, bottom):
    """Rounded-rect background with vertical gradient + subtle top sheen."""
    img = new_canvas()
    grad = vertical_gradient(W, top, bottom).convert("RGBA")
    mask = rounded_mask(W, int(W * 0.18))
    img.paste(grad, (0, 0), mask)
    # soft sheen at the top
    sheen = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sheen)
    sd.ellipse([-W * 0.3, -W * 0.65, W * 1.3, W * 0.45],
               fill=(255, 255, 255, 38))
    sheen.putalpha(Image.composite(sheen.getchannel("A"),
                   Image.new("L", (W, W), 0), mask))
    img = Image.alpha_composite(img, sheen)
    return img


def draw_pearl(d, cx, cy, r):
    # shadow
    d.ellipse([cx - r, cy - r + r * 0.14, cx + r, cy + r + r * 0.14],
              fill=(0, 40, 60, 80))
    # radial body: light center-top → soft blue rim, via stacked ellipses
    steps = 16
    for i in range(steps):
        t = i / (steps - 1)            # 0 = outer rim, 1 = inner
        rr = r * (1 - t * 0.92)
        col = lerp((196, 226, 238), (255, 255, 255), t)
        # offset toward top-left so the lit side is upper-left
        ox = -r * 0.18 * t
        oy = -r * 0.20 * t
        d.ellipse([cx - rr + ox, cy - rr + oy, cx + rr + ox, cy + rr + oy],
                  fill=col + (255,))
    # cool reflection at the lower-right (pearl luster)
    d.ellipse([cx - r * 0.1, cy + r * 0.05, cx + r * 0.7, cy + r * 0.7],
              fill=(176, 214, 230, 90))
    # bright specular highlight upper-left
    d.ellipse([cx - r * 0.5, cy - r * 0.6, cx - r * 0.05, cy - r * 0.15],
              fill=(255, 255, 255, 245))
    d.ellipse([cx - r * 0.36, cy - r * 0.48, cx - r * 0.18, cy - r * 0.30],
              fill=(255, 255, 255, 255))
    # rim
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 110),
              width=max(1, int(r * 0.05)))


def add_sparkle(d, cx, cy, r, col=(255, 255, 255, 235)):
    d.polygon([(cx, cy - r), (cx + r * 0.22, cy - r * 0.22),
               (cx + r, cy), (cx + r * 0.22, cy + r * 0.22),
               (cx, cy + r), (cx - r * 0.22, cy + r * 0.22),
               (cx - r, cy), (cx - r * 0.22, cy - r * 0.22)], fill=col)


def icon_pearls(count, mega=False):
    top, bottom = hx("#1fb6c9"), hx("#0a6f86")
    img = base_bg(top, bottom)
    d = ImageDraw.Draw(img)
    cx, cy = W / 2, W / 2 + W * 0.04
    r = W * 0.13
    # arrange pearls in a pile
    layouts = {
        3: [(-1, 0.4), (1, 0.4), (0, -0.7)],
        4: [(-1.05, 0.55), (0, 0.55), (1.05, 0.55), (0, -0.55)],
        5: [(-1.1, 0.7), (0, 0.7), (1.1, 0.7), (-0.55, -0.45), (0.55, -0.45)],
        7: [(-1.5, 0.85), (-0.5, 0.85), (0.5, 0.85), (1.5, 0.85),
            (-1.0, -0.05), (0, -0.05), (1.0, -0.05)],
    }
    pts = layouts[count]
    rr = r * (0.82 if count >= 7 else 1.0)
    for (dx, dy) in pts:
        draw_pearl(d, cx + dx * rr * 1.05, cy + dy * rr * 1.5, rr)
    if mega:
        add_sparkle(d, cx + W * 0.30, cy - W * 0.30, W * 0.06)
        add_sparkle(d, cx - W * 0.34, cy - W * 0.18, W * 0.04)
        add_sparkle(d, cx + W * 0.05, cy - W * 0.40, W * 0.035)
    return img


def icon_sea(tint_hex):
    tint = hx(tint_hex)
    top = lighten(tint, 0.25)
    bottom = darken(tint, 0.35)
    img = base_bg(top, bottom)
    d = ImageDraw.Draw(img)
    # stacked wave bands
    for i, yy in enumerate([0.40, 0.55, 0.70, 0.85]):
        col = lighten(tint, 0.45 - i * 0.08) + (235,)
        amp = W * (0.05 - i * 0.004)
        y0 = W * yy
        pts = []
        for x in range(0, W + 1, 8):
            pts.append((x, y0 + math.sin(x / W * math.pi * 3 + i) * amp))
        pts += [(W, W), (0, W)]
        d.polygon(pts, fill=col)
    # sun
    d.ellipse([W * 0.62, W * 0.16, W * 0.80, W * 0.34],
              fill=(255, 244, 214, 240))
    return img


def icon_card(tint_hex, prism=False):
    tint = hx(tint_hex)
    img = base_bg(lighten(tint, 0.3), darken(tint, 0.45))
    d = ImageDraw.Draw(img)
    # card rectangle
    cw, ch = W * 0.46, W * 0.62
    x0, y0 = (W - cw) / 2, (W - ch) / 2
    # shadow
    d.rounded_rectangle([x0 + W * 0.02, y0 + W * 0.03, x0 + cw + W * 0.02,
                         y0 + ch + W * 0.03], radius=W * 0.05,
                        fill=(0, 0, 0, 90))
    d.rounded_rectangle([x0, y0, x0 + cw, y0 + ch], radius=W * 0.05,
                        fill=lighten(tint, 0.05) + (255,))
    if prism:
        # rainbow diagonal stripes clipped to card
        stripe = Image.new("RGBA", (W, W), (0, 0, 0, 0))
        sd = ImageDraw.Draw(stripe)
        cols = [(255, 120, 160), (255, 200, 120), (180, 255, 160),
                (120, 220, 255), (180, 150, 255)]
        bw = cw / len(cols)
        for i, c in enumerate(cols):
            sd.polygon([(x0 + i * bw, y0 + ch), (x0 + i * bw + bw, y0 + ch),
                        (x0 + i * bw + bw + ch * 0.5, y0),
                        (x0 + i * bw + ch * 0.5, y0)], fill=c + (210,))
        cm = Image.new("L", (W, W), 0)
        cmd = ImageDraw.Draw(cm)
        cmd.rounded_rectangle([x0, y0, x0 + cw, y0 + ch], radius=W * 0.05,
                              fill=255)
        img.paste(stripe, (0, 0), Image.composite(
            stripe.getchannel("A"), Image.new("L", (W, W), 0), cm))
        d = ImageDraw.Draw(img)
    else:
        # inner emblem circle
        ccx, ccy = W / 2, W / 2
        d.ellipse([ccx - cw * 0.28, ccy - cw * 0.28, ccx + cw * 0.28,
                   ccy + cw * 0.28], outline=lighten(tint, 0.6) + (220,),
                  width=int(W * 0.012))
        d.ellipse([ccx - cw * 0.12, ccy - cw * 0.12, ccx + cw * 0.12,
                   ccy + cw * 0.12], fill=lighten(tint, 0.6) + (230,))
    # border
    d.rounded_rectangle([x0, y0, x0 + cw, y0 + ch], radius=W * 0.05,
                        outline=(255, 255, 255, 200), width=int(W * 0.012))
    return img


def icon_palette(colors, aurora=False):
    cols = [hx(c) for c in colors]
    img = base_bg(lighten(cols[0], 0.18), darken(cols[0], 0.25))
    d = ImageDraw.Draw(img)
    # four swatches in 2x2 with rounded corners
    pad = W * 0.16
    gap = W * 0.05
    cell = (W - pad * 2 - gap) / 2
    swatch_cols = cols[:4]
    while len(swatch_cols) < 4:
        swatch_cols.append(swatch_cols[-1])
    pos = [(0, 0), (1, 0), (0, 1), (1, 1)]
    for (gx, gy), c in zip(pos, swatch_cols):
        x0 = pad + gx * (cell + gap)
        y0 = pad + gy * (cell + gap)
        d.rounded_rectangle([x0, y0, x0 + cell, y0 + cell], radius=W * 0.045,
                            fill=c + (255,))
        d.rounded_rectangle([x0, y0, x0 + cell, y0 + cell], radius=W * 0.045,
                            outline=(255, 255, 255, 120), width=int(W * 0.008))
        # tiny sheen
        d.ellipse([x0 + cell * 0.12, y0 + cell * 0.1, x0 + cell * 0.55,
                   y0 + cell * 0.4], fill=(255, 255, 255, 40))
    if aurora:
        add_sparkle(d, W * 0.5, W * 0.5, W * 0.05)
    return img


def icon_bundle(c1, c2, gold=False):
    a, b = hx(c1), hx(c2)
    # Deep, dark background so the box always pops (independent of box hue).
    if gold:
        bg_top, bg_bottom = hx("#243047"), hx("#0e1626")
    else:
        bg_top, bg_bottom = darken(a, 0.55), hx("#0a1322")
    img = base_bg(bg_top, bg_bottom)
    d = ImageDraw.Draw(img)
    bx, by, bw, bh = W * 0.27, W * 0.40, W * 0.46, W * 0.40
    rcx = bx + bw / 2
    box_col = hx("#f0c659") if gold else lighten(a, 0.28)
    # soft drop shadow (blurred) to lift the box off the dark bg
    shadow = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([bx + W * 0.015, by + W * 0.04, bx + bw + W * 0.015,
                          by + bh + W * 0.04], radius=W * 0.03,
                         fill=(0, 0, 0, 150))
    shadow = shadow.filter(ImageFilter.GaussianBlur(W * 0.02))
    img = Image.alpha_composite(img, shadow)
    d = ImageDraw.Draw(img)
    # box body
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=W * 0.03,
                        fill=box_col + (255,))
    # subtle vertical shading on the body for depth
    d.rounded_rectangle([bx, by + bh * 0.5, bx + bw, by + bh],
                        radius=W * 0.03, fill=darken(box_col, 0.12) + (130,))
    # crisp outline so it separates from the background
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=W * 0.03,
                        outline=lighten(box_col, 0.55) + (235,),
                        width=int(W * 0.012))
    # lid
    lid_h = W * 0.09
    d.rounded_rectangle([bx - W * 0.035, by - lid_h, bx + bw + W * 0.035, by +
                         lid_h * 0.45], radius=W * 0.025,
                        fill=lighten(box_col, 0.2) + (255,))
    d.rounded_rectangle([bx - W * 0.035, by - lid_h, bx + bw + W * 0.035, by +
                         lid_h * 0.45], radius=W * 0.025,
                        outline=lighten(box_col, 0.55) + (235,),
                        width=int(W * 0.01))
    # ribbon vertical (high contrast vs box)
    rib = hx("#8a5a14") if gold else lighten(a, 0.75)
    d.rectangle([rcx - W * 0.035, by - lid_h, rcx + W * 0.035, by + bh],
                fill=rib + (255,))
    # bow
    for s in (-1, 1):
        d.polygon([(rcx, by - lid_h * 0.2),
                   (rcx + s * W * 0.13, by - lid_h * 1.5),
                   (rcx + s * W * 0.13, by + lid_h * 0.2)], fill=rib + (255,))
    d.ellipse([rcx - W * 0.04, by - lid_h * 0.5, rcx + W * 0.04,
               by + lid_h * 0.35], fill=lighten(rib, 0.18) + (255,))
    # sparkles above/around the box
    add_sparkle(d, rcx - W * 0.13, by - lid_h * 1.9, W * 0.06)
    add_sparkle(d, rcx + W * 0.15, by - lid_h * 1.5, W * 0.04)
    add_sparkle(d, bx + bw + W * 0.04, by + W * 0.04, W * 0.05)
    add_sparkle(d, bx - W * 0.02, by + bh * 0.5, W * 0.035)
    return img


def save(img, name):
    out = img.resize((S, S), Image.LANCZOS)
    out.save(f"{OUT}/{name}.png")
    print("wrote", name + ".png")


# ---- palette colors (from catalog.ts) ----
AMETHYST = ["#5a3da1", "#7d56c0", "#e0c0ff", "#241a44"]
SAND = ["#b07a32", "#d8a24e", "#ffe6a8", "#3d3020"]

save(icon_pearls(3), "pearls_small")
save(icon_pearls(4), "pearls_medium")
save(icon_pearls(5), "pearls_large")
save(icon_pearls(7, mega=True), "pearls_mega")

# sea themes — tint sampled from each theme's island/background art (public/assets/skins/*)
save(icon_sea("#cd6332"), "sea_lava")     # fiery orange (Lava island)
save(icon_sea("#00b6cd"), "sea_reef")     # turquoise (Reef art)
save(icon_sea("#3493cc"), "sea_arctic")   # icy azure (Arctic art)
save(icon_sea("#243d8b"), "sea_abyss")    # deep navy (Abyss)

save(icon_card("#3a3f4a"), "back_onyx")

save(icon_palette(AMETHYST), "ui_amethyst")
save(icon_palette(SAND), "ui_sand")

save(icon_bundle("#1aa3a3", "#7d56c0"), "bundle_founder")
save(icon_bundle("#d8a24e", "#b07a32", gold=True), "bundle_premium")
print("done")
