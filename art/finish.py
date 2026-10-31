# HyperRoot ticker image, finishing pass on the Blender render: deeper near-black ground with a soft centre light,
# bloom on the mint, a gentle vignette and fine grain. python art/finish.py art/root_raw.png ticker.png [size]
import sys
from PIL import Image, ImageFilter, ImageChops, ImageEnhance, ImageDraw
src, out = sys.argv[1], sys.argv[2]; S = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
im = Image.open(src).convert('RGB'); W = im.width
# lift contrast so the backdrop sinks toward black while the mint stays bright
im = ImageEnhance.Contrast(im).enhance(1.15)
# bloom: blur the bright parts and add them back
lum = im.convert('L').point(lambda v: 0 if v < 150 else min(255, (v - 150) * 2))
glow = Image.composite(im, Image.new('RGB', im.size, (0, 0, 0)), lum).filter(ImageFilter.GaussianBlur(W * .02))
im = ImageChops.add(im, ImageEnhance.Brightness(glow).enhance(.45))
# vignette
v = Image.new('L', im.size, 0); ImageDraw.Draw(v).ellipse((-W * .25, -W * .25, W * 1.25, W * 1.25), fill=255)
im = Image.composite(im, ImageEnhance.Brightness(im).enhance(.45), v.filter(ImageFilter.GaussianBlur(W * .18)))
# grain
n = Image.effect_noise(im.size, 26).convert('L'); im = Image.blend(im, Image.merge('RGB', (n, n, n)), .035)
im.resize((S, S), Image.LANCZOS).save(out); print('wrote', out)
