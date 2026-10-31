# HyperRoot launch film

`out/hyperroot-35s.mp4`: 35 s, 1920x1080, 60 fps (rendered at 120 fps, two frames blended per output frame for motion blur), synth score.

Built in the structure of pump.fun's own announcement videos, in HyperRoot's palette: a white field with a mint glow rising from the floor, short centred lines that blur in word by word (Geist, dark ink, one accent in mint), a big hero object, a network, a clearly labelled split, a coin rain, a counter, a dark UI card tilting in, black end cards.

Real 3D in three.js r165 (pinned, importmap from jsDelivr), rendered on a transparent canvas over the HTML field: the GLB coin (`assets/root_coin.glb`, copied from `../art`), procedural roots as tapered CatmullRom tubes with a soft fresnel halo, the orbiting platform icons, the example-coin network and the coin rain, studio light (RoomEnvironment + key + hemisphere) and a soft VSM shadow under the coin. The split bar, counter and dashboard card are HTML.

## Shots
| Time | Shot |
|---|---|
| 0 - 5.4 | "Launching a coin on pump.fun?" / "Give it roots." / "introducing" |
| 5.4 - 10 | Hero: mint rings, the $ROOT coin spins in, roots grow out, pump.fun / Hyperliquid / Axiom / GMGN / X orbit it; "HyperRoot, every coin paired with $ROOT"; push into the coin, white flash |
| 10 - 15 | Network: "Every coin [coin] is rooted in $ROOT." Example coins (letters on pastel heads) rooted to the centre coin; "Buying any coin here buys $ROOT first." |
| 15 - 21 | "Every trade pays a creator fee." One bar fills, divides into 90 % ("to the creator, automatically") and 10 % ("burns $ROOT"), holds, then the 10 % piece drips down a root into the floor and burns; "Split on chain by pump.fun's own fee sharing, in the launch transaction." |
| 21 - 24.4 | $ROOT coins burst up from the floor and rain: "Every trade pays you." / "And burns a little $ROOT." |
| 24.4 - 27.8 | Counter to "≈ 0.0073 SOL" / "to launch a coin." / "No platform fee. No dev buy." |
| 27.8 - 31.6 | "Every CA ends in root." A dark dashboard card tilts in (example data, "example data" chip), your row lights up |
| 31.6 - 35 | Black: "Launch on HyperRoot", then "$ROOT" and "Independent. Not affiliated with, sponsored or endorsed by pump.fun or Hyperliquid." |

## Re-render
```
node serve.mjs 8841                      # static server, http://127.0.0.1:8841/film.html (scrub with renderFrame(t) in devtools)
DUR=35 node music.mjs music.wav          # the score (cue times in the file follow the shots above)
bash render_film.sh http://127.0.0.1:8841/film.html frames120 35 music.wav out/hyperroot-35s.mp4
```
Stills: `node D:\cooks\pitwall\render.mjs <url> <dir> 30 0 0 "1.6,6.4,..."`.

Earlier takes kept for reference: `film_dark.html` (the dark 3D cut: roots, chain, fee slabs, root field, tilted app slab; uses `ui.html` captures in `assets/ui_*.png`) and `film_2d_draft.html`.
