// HyperRoot film score (35 s, 90 bpm, D minor, calm): a dark bed while the roots grow, a soft boom into the pair,
// pulses down the chain, a fill and a drip into the burn, typing ticks and a lock chime on the CA, the app's groove,
// thuds as the cost tiles land, the letterbox boom and a held chord under the end card.
// Synthesised here (no samples). usage: DUR=35 node music.mjs music.wav
import fs from 'node:fs'

const SR = 44100, DUR = +(process.env.DUR || 15), N = SR * DUR, TAU = Math.PI * 2
const L = new Float32Array(N), R = new Float32Array(N), VL = new Float32Array(N), VR = new Float32Array(N)
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12)
let seed = 4242
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1
const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)))
function add(i, v, pan = 0, send = 0) {
  i |= 0; if (i < 0 || i >= N) return
  const a = ((pan + 1) * Math.PI) / 4, l = v * Math.cos(a) * 1.414, r = v * Math.sin(a) * 1.414
  L[i] += l; R[i] += r; if (send) { VL[i] += l * send; VR[i] += r * send }
}
// soft plucked keys: sine + detuned triangle, fast attack, exp decay, gentle lowpass
function pluck(t0, m, amp = 0.12, dec = 4, pan = 0, send = 0.4) {
  const f = mtof(m); let y = 0
  for (let k = 0; k < Math.min(2.5, 6 / dec) * SR; k++) {
    const tt = k / SR, ph = tt * f
    let v = Math.sin(ph * TAU) * 0.7 + (4 * Math.abs(((ph * 1.003) % 1) - 0.5) - 1) * 0.35 + Math.sin(ph * 2 * TAU) * 0.15 * Math.exp(-tt * 12)
    y += 0.35 * (v - y)
    add(t0 * SR + k, y * Math.exp(-tt * dec) * Math.min(1, tt * 600) * amp, pan, send)
  }
}
function pad(t0, t1, notes, amp, att = 0.4, rel = 0.6) {
  notes.forEach((m, ni) => {
    let p1 = 0, p2 = 0, y = 0; const f = mtof(m)
    for (let i = (t0 * SR) | 0; i < Math.min(N, (t1 + rel) * SR); i++) {
      const t = i / SR, env = Math.min(1, (t - t0) / att) * (t > t1 ? Math.max(0, 1 - (t - t1) / rel) : 1)
      p1 += f / SR; p2 += (f * 1.005) / SR
      y += 0.04 * (((p1 % 1) * 2 - 1) + ((p2 % 1) * 2 - 1) - y)
      add(i, y * env * amp, ni % 2 ? 0.45 : -0.45, 0.5)
    }
  })
}
function kick(t0, amp = 0.8) { let ph = 0; for (let k = 0; k < 0.35 * SR; k++) { const tt = k / SR; ph += (TAU * (46 + 100 * Math.exp(-tt * 32))) / SR; add(t0 * SR + k, Math.sin(ph) * Math.exp(-tt * 9) * amp) } }
function snap(t0, amp = 0.3) { let p = 0; for (let k = 0; k < 0.16 * SR; k++) { const tt = k / SR, n = noise(), hp = n - p * 0.8; p = n; add(t0 * SR + k, hp * Math.exp(-tt * 30) * amp, 0.1, 0.35) } }
function hat(t0, amp = 0.08, pan = 0.3) { let p = 0; for (let k = 0; k < 0.04 * SR; k++) { const tt = k / SR, n = noise(), hp = n - p; p = n; add(t0 * SR + k, hp * Math.exp(-tt * 90) * amp, pan) } }
function sub(t0, dur, m, amp = 0.22) { const f = mtof(m); for (let k = 0; k < dur * SR; k++) { const tt = k / SR; const env = Math.min(1, tt * 80) * Math.min(1, (dur - tt) * 30); add(t0 * SR + k, Math.sin(tt * f * TAU) * env * amp) } }
function whoosh(t0, dur, amp = 0.3) { let y = 0; for (let k = 0; k < dur * SR; k++) { const p = k / (dur * SR), e = Math.sin(p * Math.PI) ** 2; y += (0.03 + 0.45 * e) * (noise() - y); add(t0 * SR + k, y * e * amp, (p - 0.5) * 1.6, 0.3) } }
function clink(t0, amp = 0.08, f = 3200, pan = 0) { for (let k = 0; k < 0.35 * SR; k++) { const tt = k / SR; add(t0 * SR + k, (Math.sin(tt * TAU * f) * 0.6 + Math.sin(tt * TAU * f * 2.71) * 0.3 + Math.sin(tt * TAU * f * 4.1) * 0.15) * Math.exp(-tt * 14) * amp, pan, 0.5) } }
function boom(t0, amp = 0.7) { let ph = 0; for (let k = 0; k < 1.5 * SR; k++) { const tt = k / SR; ph += (TAU * (40 + 50 * Math.exp(-tt * 8))) / SR; add(t0 * SR + k, Math.sin(ph) * Math.exp(-tt * 3) * amp, 0, 0.2) } }
function sparkle(t0, amp = 0.06) { ;[84, 88, 91, 96, 100, 103].forEach((m, i) => pluck(t0 + i * 0.045, m, amp, 5, i % 2 ? 0.5 : -0.5, 0.7)) }
function click(t0, amp = 0.3) { for (let k = 0; k < 0.03 * SR; k++) { const tt = k / SR; add(t0 * SR + k, (Math.sin(tt * TAU * 1800) * 0.7 + noise() * 0.3) * Math.exp(-tt * 160) * amp) } }
// extra sound design
function tick(t0, amp = 0.05) { const f = 2600 + noise() * 500; for (let k = 0; k < 0.012 * SR; k++) { const tt = k / SR; add(t0 * SR + k, (Math.sin(tt * TAU * f) * 0.5 + noise() * 0.5) * Math.exp(-tt * 380) * amp, 0.1) } }
function pop(t0, amp = 0.22, f0 = 950, f1 = 420) { let ph = 0; for (let k = 0; k < 0.12 * SR; k++) { const tt = k / SR; ph += TAU * (f1 + (f0 - f1) * Math.exp(-tt * 40)) / SR; add(t0 * SR + k, Math.sin(ph) * Math.exp(-tt * 28) * amp, 0, 0.25) } }
function boing(t0, amp = 0.2) { let ph = 0; for (let k = 0; k < 0.6 * SR; k++) { const tt = k / SR; const f = 220 * Math.pow(2, 1.6 * Math.min(1, tt * 3)) * (1 + 0.06 * Math.sin(tt * 38)); ph += TAU * f / SR; add(t0 * SR + k, Math.sin(ph) * Math.exp(-tt * 4.5) * amp, 0, 0.4) } }
function riser(t0, dur, amp = 0.18) { let y = 0; for (let k = 0; k < dur * SR; k++) { const p = k / (dur * SR); y += (0.02 + 0.5 * p * p) * (noise() - y); add(t0 * SR + k, y * p * p * amp, 0, 0.3) } }
function chime(t0) { pluck(t0, 88, 0.07, 6, 0.3, 0.6); pluck(t0 + 0.08, 95, 0.06, 6, -0.3, 0.6) }
function thud(t0, amp = 0.5) { let ph = 0; for (let k = 0; k < 0.5 * SR; k++) { const tt = k / SR; ph += (TAU * (70 + 60 * Math.exp(-tt * 18))) / SR; add(t0 * SR + k, Math.sin(ph) * Math.exp(-tt * 7) * amp, 0, 0.15) } }
function swipe(t0, dur = .32, amp = .14) { let y = 0; for (let k = 0; k < dur * SR; k++) { const p = k / (dur * SR), e = Math.sin(p * Math.PI) ** 1.5; y += (.02 + .25 * p) * (noise() - y); add(t0 * SR + k, y * e * amp, (p - .5) * .8, .2) } }
const BEAT = 60 / 90
// chords: Dm9 - Bbmaj7 - Fmaj7 - C, two beats each
const CH = [[38, 45, 50, 53, 57, 64], [34, 41, 46, 50, 53, 57], [41, 48, 53, 57, 60, 64], [36, 43, 48, 52, 55, 62]]
const BASS = [26, 22, 29, 24]
function groove(t0, t1, { kicks = true, snaps = false, hats = true, bass = true, arp = true, amp = 1 } = {}) {
  for (let t = t0; t < t1 - 0.01; t += BEAT / 2) {
    const k = Math.round((t - t0) / (BEAT / 2)), bar = Math.floor(k / 4) % 4
    if (kicks && k % 4 === 0) kick(t, .36 * amp)
    if (snaps && k % 4 === 2) snap(t, .07 * amp)
    if (hats && k % 2) hat(t, .022 * amp, k % 4 === 1 ? .3 : -.3)
    if (bass && k % 4 === 0) sub(t, BEAT * 1.9, BASS[bar], .1 * amp)
    if (arp) pluck(t, CH[bar][(k * 2) % 5 + 1] + 12, .03 * amp, 5, k % 2 ? .4 : -.4, .55)
    if (k % 4 === 0) pad(t, t + BEAT * 2 - .05, CH[bar].slice(0, 5), .011 * amp, .3, .5)
  }
}
// shared with film.html: node pop times and the rain's launch times
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const NODES = [[-5.7, 2.5, -.4], [-3.3, 3.25, .3], [-.9, 3.45, -.6], [1.7, 3.2, .2], [4.0, 3.0, -.5], [6.1, 2.0, .3], [-6.3, -.3, .2], [6.4, .25, -.3], [-5.0, -2.6, .4], [-2.5, -3.3, -.3], [.1, -3.15, .5], [2.6, -3.35, -.4], [4.9, -2.55, .3]]
// 1. lines (0 - 5.4)
pad(0, 5.3, [38, 45, 50, 53], .02, 1.2, .4); sub(.2, 5.0, 26, .045)
;[.25, .45, .65, .85, 1.05].forEach((t, i) => pluck(t, [69, 72, 74, 77, 81][i], .03, 4, i % 2 ? .3 : -.3, .6))
;[2.45, 2.61, 2.77].forEach((t, i) => pluck(t, [74, 77, 81][i], .035, 4, 0, .6)); pluck(4.55, 86, .03, 2.5, 0, .7); riser(4.4, 1.05, .14)
// 2. hero (5.4 - 10): the rings and the coin land, the icons pop in, the wordmark; the push into the coin
boom(5.45, .5); sparkle(5.5, .05); groove(5.45, 9.4, { amp: .85 })
for (let i = 0; i < 5; i++) pop(6.75 + i * .16, .09, 900 + i * 70, 450)
chime(7.25); riser(8.85, 1.1, .15); whoosh(9.3, .8, .09)
// 3. the network (10 - 15)
boom(10.0, .5); sparkle(10.05, .05); groove(10.0, 14.6, { amp: .8 })
NODES.forEach(([x, y, z]) => { const d = Math.hypot(x, y, z); pop(10.25 + d * .14 + .95, .06, 1000 + (d * 40 | 0), 480) })
pluck(12.9, 81, .035, 4, 0, .6); swipe(14.55, .45, .1)
// 4. the split (15 - 21): the fill, the split, the callout, the drip, the burn
groove(15.0, 20.6, { kicks: false, amp: .7 }); whoosh(15.5, 1.0, .05); click(16.45, .25)
pop(16.85, .12, 1200, 560); chime(17.2); pluck(17.2, 77, .04, 3, .3, .6)
for (let i = 0; i < 6; i++) pluck(18.9 + i * .13, 88 - i * 3, .028, 6, .3, .7)
thud(19.9, .4); sub(19.9, 1.2, 26, .08); for (let i = 0; i < 8; i++) clink(19.95 + i * .07, .03, 2600 + i * 180, (i % 2 ? .3 : -.3))
swipe(20.55, .45, .1)
// 5. the rain (21 - 24.4): a clink as each coin leaves the floor
boom(21.0, .45); groove(21.0, 24.2, { amp: .85 })
for (let i = 0; i < 34; i++) { const r = mulberry(500 + i); clink(21.0 + r() * 2.4 + .05, .035, 2400 + (i % 6) * 260, (i % 2 ? .4 : -.4)) }
chime(22.65); swipe(24.15, .4, .09)
// 6. the counter (24.4 - 27.8)
groove(24.4, 27.5, { kicks: false, amp: .7 }); for (let i = 0; i < 30; i++) { const x = i / 30; tick(24.65 + 1.25 * (1 - Math.pow(1 - x, 2)), .06) }
chime(25.95); pluck(26.15, 77, .035, 4, 0, .6); swipe(27.4, .4, .09)
// 7. the card (27.8 - 31.6)
groove(27.8, 31.4, { amp: .85 }); whoosh(28.0, 1.2, .07); thud(29.3, .3); chime(29.6); sparkle(29.65, .035); riser(30.6, .95, .13)
// 8. the end (31.6 - 35): black cards over a held chord
boom(31.6, .5); sub(31.6, 3.3, 26, .11); pad(31.6, 34.4, [26, 38, 45, 50, 53, 57, 64], .024, .1, .7)
pluck(31.8, 81, .035, 3, -.2, .6); pluck(33.4, 86, .035, 3, .2, .7); sparkle(33.45, .035)
/* reverb */
const taps = [[0.037, 0.5], [0.061, 0.42], [0.097, 0.36], [0.141, 0.3], [0.199, 0.24], [0.271, 0.19], [0.37, 0.14], [0.5, 0.1], [0.66, 0.07]]
let dl = 0, dr = 0
for (let i = 0; i < N; i++) {
  let l = 0, r = 0
  for (const [d, g] of taps) { const j = i - Math.floor(d * SR); if (j >= 0) { l += VR[j] * g; r += VL[j] * g } }
  dl += 0.4 * (l - dl); dr += 0.4 * (r - dr); L[i] += dl * 0.7; R[i] += dr * 0.7
}
/* master */
let peak = 0
for (let i = 0; i < N; i++) { const t = i / SR, f = seg(t, 0, 0.05) * (1 - seg(t, DUR - 1, DUR)); L[i] = Math.tanh(L[i] * 1.1) * f; R[i] = Math.tanh(R[i] * 1.1) * f; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])) }
const g = 0.9 / peak, buf = Buffer.alloc(44 + N * 4)
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4) }
fs.writeFileSync(process.argv[2] || 'music.wav', buf)
console.log('wrote', process.argv[2], 'peak', peak.toFixed(2))
