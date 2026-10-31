// The story: one pinned stage. Scrolling scrubs a single GSAP timeline, so the page seems to stand still while the scene
// changes: roots draw from your coin to $ROOT to HYPE, the creator fee splits and drips into a burn, an example CA types
// out and its ending locks in, and the cost card assembles. Each change of scene uses a different reveal (circle mask,
// wipe, scale from blur). Lenis drives the scroll. With reduced motion the scenes are plain stacked cards (hl.css).
;(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  let lenis = null
  if (window.Lenis && !still) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
    window.lenis = lenis
  }
  if (!window.gsap || !window.ScrollTrigger || still) { if (!still) document.documentElement.classList.add('static-story'); if (lenis) { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf) }; requestAnimationFrame(raf) } placeNodes(); addEventListener('resize', placeNodes); return }
  gsap.registerPlugin(ScrollTrigger)
  if (lenis) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0) }

  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)]

  // split a heading into words of characters (keeps <em>), so letters can rise and unblur one by one
  function split(el) {
    const out = []
    const walk = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment()
          n.nodeValue.split(/(\s+)/).forEach((w) => {
            if (!w) return
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return }
            const ws = document.createElement('span'); ws.style.cssText = 'display:inline-block;white-space:nowrap'
            for (const ch of w) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; ws.appendChild(s); out.push(s) }
            frag.appendChild(ws)
          })
          n.replaceWith(frag)
        } else if (n.nodeType === 1) walk(n)
      }
    }
    walk(el); return out
  }

  // the root nodes sit on the drawing's own coordinates (viewBox 600 x 640)
  function placeNodes() {
    const svg = $('.roots'), sc = $('.s1'); if (!svg || !sc) return
    const r = svg.getBoundingClientRect(), b = sc.getBoundingClientRect(), k = r.width / 600
    const at = { n1: [300, 52], n2: [300, 296], n3: [300, 568] }
    for (const [cls, [x, y]] of Object.entries(at)) { const n = $('.' + cls); if (n) { n.style.left = r.left - b.left + x * k + 'px'; n.style.top = r.top - b.top + y * k + 'px' } }
  }

  const scenes = $$('.scene'), [s1, s2, s3, s4] = scenes
  gsap.set([s2, s3, s4], { autoAlpha: 0 })
  placeNodes(); addEventListener('resize', () => { placeNodes(); ScrollTrigger.refresh() })

  // strokes start undrawn
  const strokes = $$('.roots path').concat($$('.drip path'))
  strokes.forEach((p) => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }) })

  const chars = scenes.map((s) => split($('.split', s)))
  const rise = (tl, list, at) => tl.from(list, { yPercent: 70, opacity: 0, filter: 'blur(8px)', stagger: 0.012, duration: 0.35, ease: 'power3.out' }, at)

  const tl = gsap.timeline({ defaults: { ease: 'none' } })
  // ---- 1: roots draw, nodes arrive
  rise(tl, chars[0], 0)
  tl.from($('.s1 .cap p'), { opacity: 0, y: 18, duration: 0.3 }, 0.15)
  tl.from($('.n1'), { scale: 0.6, opacity: 0, filter: 'blur(10px)', duration: 0.2 }, 0.05)
  tl.to($$('.roots path')[0], { strokeDashoffset: 0, duration: 0.35 }, 0.15)
  tl.to($$('.roots path').slice(2, 4), { strokeDashoffset: 0, duration: 0.4, stagger: 0.05 }, 0.2)
  tl.from($('.n2'), { scale: 0.6, opacity: 0, filter: 'blur(10px)', duration: 0.2 }, 0.45)
  tl.to($$('.roots path')[1], { strokeDashoffset: 0, duration: 0.35 }, 0.55)
  tl.to($$('.roots path').slice(4), { strokeDashoffset: 0, duration: 0.45, stagger: 0.05 }, 0.6)
  tl.from($('.n3'), { scale: 0.6, opacity: 0, filter: 'blur(10px)', duration: 0.2 }, 0.85)
  tl.to({}, { duration: 0.25 })                                                    // hold
  // ---- 1 -> 2: a circle opens from the right while scene 1 sinks back
  tl.addLabel('t2')
  tl.set(s2, { autoAlpha: 1, clipPath: 'circle(0% at 78% 50%)' }, 't2')
  tl.to(s1, { scale: 0.93, opacity: 0.25, filter: 'blur(4px)', duration: 0.4 }, 't2')
  tl.to(s2, { clipPath: 'circle(150% at 78% 50%)', duration: 0.45, ease: 'power2.inOut' }, 't2')
  tl.set(s1, { autoAlpha: 0 })
  // ---- 2: the fee bar fills, the 10 % drips down into the burn
  rise(tl, chars[1], '>-0.15')
  tl.from($('.s2 .cap p'), { opacity: 0, y: 18, duration: 0.3 }, '<0.1')
  tl.from($('.fbar'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.4, ease: 'power2.out' }, '<')
  tl.from($('.f10'), { backgroundColor: 'rgba(0,0,0,0)', duration: 0.2 }, '>-0.05')
  tl.to($('.drip path'), { strokeDashoffset: 0, duration: 0.45 }, '>')
  tl.from($('.burn'), { y: 30, opacity: 0, filter: 'blur(8px)', duration: 0.3 }, '>-0.15')
  tl.from($('.burn .fl'), { scale: 0, duration: 0.25, ease: 'back.out(3)' }, '<0.1')
  tl.to({}, { duration: 0.25 })
  // ---- 2 -> 3: a wipe up from the bottom, scene 2 drifts up (parallax)
  tl.addLabel('t3')
  tl.set(s3, { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' }, 't3')
  tl.to(s2, { yPercent: -12, opacity: 0, duration: 0.45 }, 't3')
  tl.to(s3, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'power3.inOut' }, 't3')
  tl.set(s2, { autoAlpha: 0 })
  // ---- 3: the example CA types out, then its ending locks in
  rise(tl, chars[2], '>-0.2')
  tl.from($('.s3 .cap p'), { opacity: 0, y: 18, duration: 0.3 }, '<0.1')
  const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', body = Array.from({ length: 40 }, (_, i) => B58[(i * 37 + 11) % 58]).join('')
  const typed = { n: 0 }, out = $('#caType'), sfx = $('#caSfx')
  gsap.set(sfx, { opacity: 0, display: 'none' })
  tl.from($('.caline'), { opacity: 0, y: 24, duration: 0.25 }, '<')
  tl.to(typed, { n: body.length, duration: 0.6, onUpdate: () => (out.textContent = body.slice(0, Math.round(typed.n))) }, '>')
  tl.set(sfx, { display: 'inline-block' }, '>')
  tl.fromTo(sfx, { opacity: 0, scale: 1.8, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.25, ease: 'back.out(2)' }, '>')
  tl.to({}, { duration: 0.25 })
  // ---- 3 -> 4: the next scene comes into focus from a soft, oversized blur
  tl.addLabel('t4')
  tl.set(s4, { autoAlpha: 1, scale: 1.12, filter: 'blur(16px)', opacity: 0 }, 't4')
  tl.to(s3, { scale: 0.94, filter: 'blur(6px)', opacity: 0, duration: 0.4 }, 't4')
  tl.to(s4, { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 0.45, ease: 'power2.out' }, 't4')
  tl.set(s3, { autoAlpha: 0 })
  // ---- 4: the cost card assembles from its parts
  rise(tl, chars[3], '>-0.2')
  const parts = $$('.costcard > *'), from = [[-160, -90, -8], [180, -120, 7], [-200, 140, 6], [160, 120, -9], [0, 160, 0]]
  parts.forEach((p, i) => tl.from(p, { x: from[i][0], y: from[i][1], rotate: from[i][2], opacity: 0, filter: 'blur(10px)', duration: 0.35, ease: 'power3.out' }, `<${i ? 0.08 : 0}`))
  tl.from($('.costcard'), { backgroundColor: 'rgba(0,0,0,0)', borderColor: 'rgba(0,0,0,0)', duration: 0.2 }, '>-0.1')
  tl.to({}, { duration: 0.3 })

  // progress ticks: which scene is up
  const ticks = $$('.progress i'), marks = [0, tl.labels.t2, tl.labels.t3, tl.labels.t4]
  ScrollTrigger.create({
    trigger: '#story', start: 'top top', end: () => '+=' + innerHeight * 4.2, pin: true, scrub: 0.8, animation: tl, anticipatePin: 1,
    onUpdate: (st) => { const t = st.progress * tl.duration(); ticks.forEach((k, i) => k.classList.toggle('on', t >= marks[i] - 0.05 && (i === 3 || t < marks[i + 1] - 0.05))) },
  })
  ticks[0]?.classList.add('on')
  document.fonts?.ready.then(() => { placeNodes(); ScrollTrigger.refresh() })
})()
