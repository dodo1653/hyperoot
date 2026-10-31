# HyperRoot ticker image: a glowing mint node with a root system growing down from it on near-black, and the word
# "root" in Instrument Serif. Roots are grown procedurally (tapered strokes that branch and wander), drawn twice:
# a soft glow pass and a sharp core pass, with a fine grain over everything. Drawn at 2x, scaled down.
# python art/ticker.py out.png [variant: mark|word] [seed] [size]
import sys, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

out = sys.argv[1]; variant = sys.argv[2] if len(sys.argv) > 2 else 'word'; seed = int(sys.argv[3]) if len(sys.argv) > 3 else 11
S = int(sys.argv[4]) if len(sys.argv) > 4 else 1000; K = 2; W = S * K; random.seed(seed)
MINT, DEEP, INK = (126, 242, 214), (40, 160, 135), (8, 11, 10)

bg = Image.new('RGB', (W, W), INK)
# a soft spotlight behind the node
spot = Image.new('L', (W, W), 0); ImageDraw.Draw(spot).ellipse((W * .18, W * .06, W * .82, W * .62), fill=70)
bg = Image.composite(Image.new('RGB', (W, W), (18, 42, 36)), bg, spot.filter(ImageFilter.GaussianBlur(W * .12)))

lines = Image.new('L', (W, W), 0); d = ImageDraw.Draw(lines)
node = (W * .5, W * (.30 if variant == 'word' else .26))
segs = []
def grow(x, y, ang, width, length, depth):
    # one root: a wandering tapered stroke that may fork
    steps = int(length / (W * .012))
    for i in range(steps):
        ang += random.gauss(0, .09) + (math.pi / 2 - ang) * .035          # wander, but keep heading down
        nx, ny = x + math.cos(ang) * W * .012, y + math.sin(ang) * W * .012
        w = max(W * .0018, width * (1 - i / steps * .55))
        segs.append((x, y, nx, ny, w, depth)); x, y = nx, ny
        if depth < 5 and random.random() < .055 + depth * .01 and i > 2:
            grow(x, y, ang + random.choice((-1, 1)) * random.uniform(.35, .75), w * .62, length * random.uniform(.45, .7), depth + 1)
        if y > W * .98 or x < -W * .05 or x > W * 1.05: return
    if depth < 4: grow(x, y, ang + random.uniform(-.5, .5), w * .7, length * .5, depth + 1)
spread = [-1.05, -.55, -.18, .18, .55, 1.05] if variant == 'word' else [-1.15, -.7, -.3, 0, .3, .7, 1.15]
for a in spread:
    grow(node[0], node[1], math.pi / 2 + a * .9, W * (.03 if abs(a) < .4 else .022), W * random.uniform(.42, .62), 0)
for x1, y1, x2, y2, w, dep in segs:
    d.line((x1, y1, x2, y2), fill=255 if dep < 2 else 210, width=max(1, int(w)))
    r = w / 2; d.ellipse((x2 - r, y2 - r, x2 + r, y2 + r), fill=255 if dep < 2 else 210)
# fade the roots out toward the bottom and the sides
fade = Image.new('L', (W, W), 0); fp = fade.load()
for yy in range(0, W, 4):
    for xx in range(0, W, 4):
        v = int(255 * max(0, min(1, 1.25 - math.hypot((xx - node[0]) / (W * .62), (yy - node[1]) / (W * .78)))))
        for a in range(4):
            for b in range(4):
                if xx + a < W and yy + b < W: fp[xx + a, yy + b] = v
lines = ImageChops.multiply(lines, fade)
glow = lines.filter(ImageFilter.GaussianBlur(W * .012))
img = Image.composite(Image.new('RGB', (W, W), DEEP), bg, glow)
img = Image.composite(Image.new('RGB', (W, W), MINT), img, lines)

# the node: a solid mint disc with a dark "r" mark ring, and its glow
nr = W * (.085 if variant == 'word' else .11)
halo = Image.new('L', (W, W), 0); ImageDraw.Draw(halo).ellipse((node[0] - nr * 2.2, node[1] - nr * 2.2, node[0] + nr * 2.2, node[1] + nr * 2.2), fill=150)
img = Image.composite(Image.new('RGB', (W, W), (90, 230, 200)), img, halo.filter(ImageFilter.GaussianBlur(W * .05)))
dd = ImageDraw.Draw(img)
dd.ellipse((node[0] - nr, node[1] - nr, node[0] + nr, node[1] + nr), fill=MINT)
dd.ellipse((node[0] - nr * .42, node[1] - nr * .42, node[0] + nr * .42, node[1] + nr * .42), fill=INK)

if variant == 'word':
    # "root" in Instrument Serif, light, centred low; a dark band behind keeps it readable over the roots
    font = ImageFont.truetype('D:/cooks/hyperroot/art/InstrumentSerif-Regular.ttf', int(W * .26))
    bb = dd.textbbox((0, 0), 'root', font=font); tw, th = bb[2] - bb[0], bb[3] - bb[1]
    tx, ty = (W - tw) / 2 - bb[0], W * .64 - bb[1]
    band = Image.new('L', (W, W), 0); ImageDraw.Draw(band).rounded_rectangle((tx + bb[0] - W * .06, ty + bb[1] - W * .03, tx + bb[0] + tw + W * .06, ty + bb[1] + th + W * .05), W * .04, fill=190)
    img = Image.composite(Image.new('RGB', (W, W), INK), img, band.filter(ImageFilter.GaussianBlur(W * .03)))
    ImageDraw.Draw(img).text((tx, ty), 'root', font=font, fill=(244, 247, 245))

# fine grain
noise = Image.effect_noise((W, W), 22).convert('L'); img = Image.blend(img, Image.merge('RGB', (noise, noise, noise)), .045)
img.resize((S, S), Image.LANCZOS).save(out)
print('wrote', out)
