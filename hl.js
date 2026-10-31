// HyperRoot app: one screen of live panels (trades, top, newest, counters) from /api/r?path=pad every 5 s, plus the
// launch / coin / perks sheets. Brand values come from window.PAD (brand.js). story.js runs the pinned story below.
;(() => {
  const $ = (id) => document.getElementById(id)
  const P = window.PAD, TK = '$' + P.ticker, SFX = P.suffix
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const short = (a) => (a ? String(a).slice(0, 4) + '…' + String(a).slice(-4) : '')
  const caHtml = (a) => { a = String(a); const k = a.toLowerCase().endsWith(SFX.toLowerCase()) ? SFX.length : 4; return esc(a.slice(0, 4)) + '…<b class="sfx">' + esc(a.slice(-k)) + '</b>' }
  const usd = (v) => (v == null || !isFinite(v) ? '–' : '$' + (v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : (+v).toFixed(v < 10 ? 2 : 0)))
  const kfmt = (v) => (v == null || !isFinite(v) ? '–' : v >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : (+v).toFixed(v < 10 ? 2 : 0))
  const num = (v) => (v == null || !isFinite(v) ? '–' : (+v).toLocaleString('en-US'))
  const ago = (t) => { const s = Math.max(1, (Date.now() - t) / 1000); return s < 60 ? Math.round(s) + 's' : s < 3600 ? Math.round(s / 60) + 'm' : s < 86400 ? Math.round(s / 3600) + 'h' : Math.round(s / 86400) + 'd' }
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v }
  const api = async (path) => { const r = await fetch(`/api/r?path=${path}`, { cache: 'no-store' }); const t = await r.text(); try { return JSON.parse(t) } catch { return { error: r.ok ? 'empty answer' : 'unreachable (' + r.status + ')' } } }
  // the launcher: the portable pump.fun launch kit (assets/launcher.js -> window.PumpLaunch). Before $ROOT exists it
  // launches a plain coin paired with P.quoteName (that's how $ROOT itself goes live); once P.quoteMint is set, every
  // launch trades against $ROOT and splits its creator fee (P.creatorPct to the creator, P.burnPct to the buyback wallet)
  const LX = () => (window.HLX ? Promise.resolve(window.HLX) : new Promise((ok, no) => {
    const sc = document.createElement('script'); sc.src = 'assets/launcher.js'
    sc.onload = () => ok(window.HLX = {
      connectSol: () => PumpLaunch.connect(),
      launchPump: async (o, note) => {
        const r = await PumpLaunch.launch({ owner: o.sol, image: o.image, name: o.name, symbol: o.symbol, description: o.description, twitter: o.twitter, website: o.website, telegram: o.telegram,
          pair: P.quoteName, feeBps: o.feeBps, buy: 0, quoteCoin: P.quoteMint || undefined, split: P.quoteMint && P.buyback ? [{ address: P.buyback, shareBps: P.burnPct * 100 }] : undefined }, note)
        return { mint: r.mint, sig: r.signature, image: r.image }
      },
    })
    sc.onerror = no; document.head.appendChild(sc)
  }))
  const pic = (c) => (c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : `<span class="ph">${esc(String(c.symbol || '?').slice(0, 1))}</span>`)

  // ------------------------------------------------------------ live data
  let coins = [], seen = new Set(), first = true
  const emptyHtml = (big, small) => `<div class="empty"><span class="big">${big}</span><span>${small}</span></div>`
  function feed(list) {
    const el = $('feed')
    if (!list.length) { el.innerHTML = `<li style="border:0;display:contents">${emptyHtml('Quiet so far.', `Every buy and sell on a ${esc(P.brand)} coin streams in here.`)}</li>`; $('fDot').className = 'pulse'; return }
    const key = (f) => `${f.at}|${f.mint}|${f.user}|${f.amount ?? f.he}`
    el.innerHTML = list.slice(0, 40).map((f) => `<li class="${f.buy ? 'b' : 's'}${!first && !seen.has(key(f)) ? ' new' : ''}"><i></i>
      <span class="tx"><a href="https://solscan.io/account/${esc(f.user)}" target="_blank" rel="noopener"><b>${esc(short(f.user))}</b></a> ${f.buy ? 'bought' : 'sold'} <span class="v">${kfmt(f.amount ?? f.he)} ${TK}</span> of <a href="#" data-coin="${esc(f.mint)}"><b>$${esc(f.symbol)}</b></a></span>
      <span class="tm">${usd(f.usd)}<br>${ago(f.at)}</span></li>`).join('')
    seen = new Set(list.map(key)); first = false
    $('fDot').className = 'pulse on'; set('fAge', 'last trade ' + ago(list[0].at) + ' ago')
  }
  function board() {
    const top = coins.filter((c) => c.vol24 > 0).sort((a, b) => b.vol24 - a.vol24).slice(0, 20)
    $('board').innerHTML = !top.length ? emptyHtml('No volume yet.', 'Coins rank here by 24 h volume through ' + TK + '.')
      : `<div class="row hd"><span>#</span><span>Coin</span><span class="r">Vol 24 h</span><span class="r">MC</span><span class="r">Trades</span><span class="r">Age</span></div>` +
        top.map((c, i) => `<button type="button" class="row" data-coin="${esc(c.mint)}"><span class="rk">${i + 1}</span><span class="cn">${pic(c)}<span>${esc(c.name)}${c.rooted ? '<span class="rooted">Rooted</span>' : ''}<small>$${esc(c.symbol)}</small></span></span><span class="r">${usd(c.vol24)}</span><span class="r">${usd(c.mc)}</span><span class="r dim">${num(c.trades)}</span><span class="r dim">${c.createdAt ? ago(c.createdAt) : ''}</span></button>`).join('')
  }
  function newest() {
    const pinned = coins.filter((c) => c.rooted && Date.now() - (c.createdAt || 0) < 3600e3), rest = coins.filter((c) => !pinned.includes(c))
    const list = [...pinned, ...rest].slice(0, 30)
    $('newest').innerHTML = !list.length ? `<li style="border:0;display:contents">${emptyHtml('Be the first.', `The first coin launched here shows up here, paired with ${TK}.`)}</li>`
      : list.map((c) => `<li class="${pinned.includes(c) ? 'pin' : ''}"><button type="button" data-coin="${esc(c.mint)}"><span class="cn">${pic(c)}<span>${esc(c.name)}${c.rooted ? '<span class="rooted">Rooted</span>' : ''}<small>$${esc(c.symbol)} · ${caHtml(c.mint)}</small></span></span><span class="mc">${usd(c.mc)}<small>${c.createdAt ? ago(c.createdAt) + ' ago' : ''}</small></span></button></li>`).join('')
    set('nCount', coins.length ? coins.length + ' coin' + (coins.length > 1 ? 's' : '') : '')
  }
  async function pad() {
    const d = await api('pad').catch(() => null)
    if (!d || d.error) return
    // the quote coin's numbers only count when they are for OUR quote coin (none until it launches)
    const q = d.quote || d.hypeedge || {}, he = P.quoteMint && q.mint === P.quoteMint ? q : {}, bb = d.buyback || {}
    coins = d.coins || []
    set('cBurned', kfmt(bb.burned ?? 0)); set('cVol', usd(d.totals?.vol24 ?? 0)); set('cLaunched', num(d.totals?.launched ?? coins.length)); set('cMc', usd(he.mc)); set('qMc', usd(he.mc))
    set('qPrice', he.priceUsd ? '$' + (+he.priceUsd).toPrecision(3) : he.priceHype ? (+he.priceHype).toPrecision(3) + ' ' + P.quoteName : '–')
    if (bb.wallet) $('cBurnLink').href = `https://solscan.io/account/${bb.wallet}`; else $('cBurnLink').removeAttribute('href')
    feed(d.feed || []); board(); newest()
  }
  feed([]); board(); newest()                                          // honest empty states right away
  pad(); setInterval(() => { if (!document.hidden) pad() }, 5000)

  // ------------------------------------------------------------ sheets
  const scrim = $('scrim'); let openSheet = null
  function open(name) {
    close(); const s = $('sheet-' + name); if (!s) return
    s.hidden = false; scrim.hidden = false; requestAnimationFrame(() => { s.classList.add('on'); scrim.classList.add('on') }); openSheet = s
    window.lenis?.stop()
  }
  function close() {
    if (!openSheet) return; const s = openSheet; openSheet = null
    s.classList.remove('on'); scrim.classList.remove('on'); setTimeout(() => { if (!s.classList.contains('on')) { s.hidden = true; if (!openSheet) scrim.hidden = true } }, 380)
    window.lenis?.start()
  }
  scrim.onclick = close; addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); open(o.dataset.open); return }
    if (e.target.closest('[data-close]')) { close(); return }
    const c = e.target.closest('[data-coin]'); if (c) { e.preventDefault(); coinSheet(c.dataset.coin); return }
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); const t = $(g.dataset.go) || $('app'); window.lenis ? window.lenis.scrollTo(t, { duration: 1.2 }) : t.scrollIntoView({ behavior: 'smooth' }) }
  })
  function coinSheet(mint) {
    const c = coins.find((x) => x.mint === mint) || { mint, name: 'Coin', symbol: '' }
    set('cdTitle', c.name)
    $('cdBody').innerHTML = `<div class="hd">${pic(c)}<div><b>${esc(c.name)}</b><span>$${esc(c.symbol)} / ${TK}</span></div></div>
      <dl><div><dt>Market cap</dt><dd>${usd(c.mc)}</dd></div><div><dt>Volume 24 h</dt><dd>${usd(c.vol24)}</dd></div><div><dt>Trades</dt><dd>${num(c.trades)}</dd></div><div><dt>Creator fee</dt><dd>${c.feeBps ? c.feeBps / 100 + ' %' : '–'}</dd></div>
      <div><dt>Launched</dt><dd>${c.createdAt ? ago(c.createdAt) + ' ago' : '–'}</dd></div><div><dt>Status</dt><dd>${c.graduated ? 'graduated' : 'on the curve'}</dd></div></dl>
      <div class="ca">${esc(mint)}</div>
      <div class="links"><a class="btn accent" href="https://pump.fun/coin/${esc(mint)}" target="_blank" rel="noopener">Trade on pump.fun</a>${c.signature ? `<a class="btn ghost" href="https://solscan.io/tx/${esc(c.signature)}" target="_blank" rel="noopener">Create tx</a>` : ''}<a class="btn ghost" href="https://dexscreener.com/solana/${esc(mint)}" target="_blank" rel="noopener">DexScreener</a>${c.creator ? `<a class="btn ghost" href="https://solscan.io/account/${esc(c.creator)}" target="_blank" rel="noopener">Creator</a>` : ''}</div>`
    open('coin')
  }

  // ------------------------------------------------------------ launch studio
  let pic64 = null, sol = null, feeBps = 100
  const note = (t, bad) => { $('lNote').textContent = t || ''; $('lNote').classList.toggle('err', !!bad) }
  const step = (k, st) => { const li = $('lSteps').querySelector(`[data-k="${k}"]`); if (li) li.className = st || '' }
  const pick = async (f) => {
    if (!f || !/^image\//.test(f.type)) return note('pick a png, jpg, webp or gif', true)
    const bmp = await createImageBitmap(f), side = Math.min(bmp.width, bmp.height), cv = document.createElement('canvas'); cv.width = cv.height = 512
    cv.getContext('2d').drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 512, 512)
    pic64 = f.type === 'image/gif' && f.size < 1_000_000 ? await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f) }) : cv.toDataURL('image/jpeg', 0.9)   // small: indexers give up on big pictures
    $('pvImg').innerHTML = `<img src="${pic64}" alt="">`; note('')
  }
  $('lFile').onchange = (e) => pick(e.target.files[0])
  const drop = $('lPic'); drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('drag') }; drop.ondragleave = () => drop.classList.remove('drag'); drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('drag'); pick(e.dataTransfer.files[0]) }
  const https_ = (v) => { v = String(v || '').trim(); return v && !/^https?:\/\//i.test(v) ? 'https://' + v : v }
  $('lSym').oninput = (e) => (e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 10))
  $('lFee').querySelectorAll('button').forEach((b) => (b.onclick = () => { feeBps = +b.dataset.b; $('lFee').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)) }))
  const connect = async () => { const X = await LX(); sol = await X.connectSol(); const w = $('wallet'); w.classList.add('on'); w.querySelector('span').textContent = short(sol); return sol }
  $('wallet').onclick = () => connect().catch((e) => { open('launch'); note(e.message, true) })
  $('lGo').onclick = async () => {
    const name = $('lName').value.trim(), symbol = $('lSym').value.trim(), go = $('lGo')
    if (!name || !symbol || !pic64) return note('a picture, a name and a ticker first', true)
    go.disabled = true; ['meta', 'sign', 'live'].forEach((k) => step(k)); $('lDone').innerHTML = ''
    let cur = 'meta'
    try {
      const X = await LX(); if (!sol) await connect()
      step('meta', 'run')
      const r = await X.launchPump({ name, symbol, description: $('lDesc').value.trim(), twitter: https_($('lX').value), website: https_($('lWeb').value), telegram: https_($('lTg').value), image: pic64, sol, pair: P.launchPair || 'HYPEEDGE', feeBps }, (t) => {
        note(t)
        if (/approve|sign/i.test(t) && cur === 'meta') { step('meta', 'ok'); step(cur = 'sign', 'run') }
        if (/send/i.test(t) && cur !== 'live') { step('meta', 'ok'); step('sign', 'ok'); step(cur = 'live', 'run') }
      })
      ;['meta', 'sign', 'live'].forEach((k) => step(k, 'ok')); note(`$${symbol} is live on pump.fun, paired with ${TK}.`)
      $('lDone').innerHTML = `<div class="done"><b>$${esc(symbol)} is live</b><span>CA <a href="https://pump.fun/coin/${esc(r.mint)}" target="_blank" rel="noopener">${esc(r.mint)}</a></span>${r.sig ? `<span><a href="https://solscan.io/tx/${esc(r.sig)}" target="_blank" rel="noopener">Create transaction ↗</a></span>` : ''}</div>`
      pad()
    } catch (e) { step(cur, 'no'); note(String(e?.message || e).slice(0, 240), true) }
    go.disabled = false
  }

  // ------------------------------------------------------------ phones: tab bar <-> swipeable panels
  const swipe = $('swipe'), tabs = [...document.querySelectorAll('.tabs [data-tab]')]
  const show = (t) => { const p = swipe.querySelector(`[data-tab="${t}"]`); if (p) swipe.scrollTo({ left: p.offsetLeft - 12, behavior: 'smooth' }) }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b && !b.classList.contains('panel')) { show(b.dataset.tab); window.lenis?.scrollTo(0) } })
  swipe.addEventListener('scroll', () => { const i = Math.round(swipe.scrollLeft / Math.max(1, swipe.clientWidth)); const t = swipe.children[i]?.dataset.tab; tabs.forEach((b) => b.classList.toggle('on', b.dataset.tab === t)) }, { passive: true })

  // ------------------------------------------------------------ search: any CA, or a ticker / name among coins here
  const qIn = $('q'), sres = $('sres'), isCA = (v) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)
  function results(v) {
    v = v.trim(); if (!v) { sres.hidden = true; return }
    const low = v.toLowerCase().replace(/^\$/, ''), hits = coins.filter((c) => c.symbol.toLowerCase().includes(low) || c.name.toLowerCase().includes(low) || c.mint === v).slice(0, 6)
    sres.innerHTML = (isCA(v) ? `<button type="button" class="sr" data-lookup="${esc(v)}"><span class="ph">CA</span><span><b>Open ${esc(short(v))}</b><small>any pump.fun coin</small></span></button>` : '')
      + hits.map((c) => `<button type="button" class="sr" data-coin="${esc(c.mint)}">${pic(c)}<span><b>$${esc(c.symbol)}</b><small>${esc(c.name)} · ${usd(c.mc)}</small></span></button>`).join('')
      + (!isCA(v) && !hits.length ? '<p class="sr none">No coin here by that name. Paste a CA to open any pump.fun coin.</p>' : '')
    sres.hidden = false
  }
  qIn.addEventListener('input', () => results(qIn.value))
  qIn.addEventListener('focus', () => results(qIn.value))
  $('search').addEventListener('submit', (e) => { e.preventDefault(); const v = qIn.value.trim(); if (isCA(v)) lookup(v); else { const c = sres.querySelector('[data-coin]'); if (c) c.click() } })
  document.addEventListener('click', (e) => { const l = e.target.closest('[data-lookup]'); if (l) { e.preventDefault(); lookup(l.dataset.lookup) } if (!e.target.closest('#search')) sres.hidden = true })
  addEventListener('keydown', (e) => { if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { e.preventDefault(); qIn.focus(); qIn.select() } })
  async function lookup(mint) {
    sres.hidden = true; qIn.blur()
    if (coins.some((c) => c.mint === mint)) return coinSheet(mint)
    set('cdTitle', 'Looking up…'); $('cdBody').innerHTML = '<p class="muted">Reading the coin from the chain…</p>'; open('coin')
    const r = await api('coin&mint=' + encodeURIComponent(mint))
    if (r.error) { set('cdTitle', 'Not found'); $('cdBody').innerHTML = `<p class="muted">${esc(r.error)}</p><div class="ca">${esc(mint)}</div>`; return }
    set('cdTitle', r.name || 'Coin')
    $('cdBody').innerHTML = `<div class="hd">${pic(r)}<div><b>${esc(r.name || 'Unnamed')}</b><span>$${esc(r.symbol)} / ${esc(r.pair)}</span></div></div>
      ${r.onPad ? '' : `<p class="note">Not launched on ${esc(P.brand)}: this coin trades against ${esc(r.pair)}, not $${esc(P.ticker)}.</p>`}
      <dl><div><dt>Market cap</dt><dd>${usd(r.mc)}</dd></div><div><dt>Pair</dt><dd>${esc(r.pair)}</dd></div><div><dt>Creator fee</dt><dd>${r.feeBps ? r.feeBps / 100 + ' %' : 'pump.fun default'}</dd></div><div><dt>Status</dt><dd>${r.graduated ? 'graduated' : 'on the curve'}</dd></div></dl>
      <div class="ca">${esc(mint)}</div>
      <div class="links"><a class="btn accent" href="https://pump.fun/coin/${esc(mint)}" target="_blank" rel="noopener">Open on pump.fun</a><a class="btn ghost" href="https://solscan.io/token/${esc(mint)}" target="_blank" rel="noopener">Solscan</a><a class="btn ghost" href="https://solscan.io/account/${esc(r.creator)}" target="_blank" rel="noopener">Creator</a></div>`
  }
  // deep links: ?ca=<mint> opens that coin
  { const ca = new URLSearchParams(location.search).get('ca'); if (ca && isCA(ca)) setTimeout(() => lookup(ca), 600) }

  // ------------------------------------------------------------ docs: addresses filled live, the TOC follows the reader
  const docAddr = () => { const d = document.querySelector('[data-addr="buyback"]'); if (d) d.textContent = P.buyback || 'set at launch' }
  docAddr()
  $('toc').addEventListener('click', (e) => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' }) })
  { const art = $('docBody'), links = [...$('toc').querySelectorAll('a')]
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) links.forEach((l) => l.classList.toggle('on', l.getAttribute('href') === '#' + x.target.id)) }), { root: art, rootMargin: '-10% 0px -70% 0px' })
    art.querySelectorAll('section').forEach((sct) => io.observe(sct)) }

  // ------------------------------------------------------------ light / dark
  $('theme').onclick = () => { const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = t; try { localStorage.setItem('pad-theme', t) } catch {} }

  // ------------------------------------------------------------ install as an app
  ;(() => {
    const box = $('install'), standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone
    let no = false; try { no = localStorage.getItem('pad-install') === 'no' } catch {}
    if (standalone || no || !matchMedia('(max-width: 820px)').matches) return
    let deferred = null
    addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; set('installHow', 'One tap, no app store.'); $('installBtn').hidden = false; box.hidden = false })
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) box.hidden = false
    $('installBtn').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice.catch(() => null); box.hidden = true }
    $('installX').onclick = () => { box.hidden = true; try { localStorage.setItem('pad-install', 'no') } catch {} }
  })()
  // the film's sound: muted until asked (browsers only autoplay muted video)
  { const v = $('film'), b = $('snd'); if (v && b) b.addEventListener('click', () => { v.muted = !v.muted; if (!v.muted) { v.volume = 0.8; v.play().catch(() => {}) } b.classList.toggle('on', !v.muted); b.setAttribute('aria-label', v.muted ? 'Sound on' : 'Sound off') }) }
  // phone: show the app's tab bar once the app is reached
  { const app = $('app'); if (app && 'IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => document.documentElement.classList.toggle('in-app', e.isIntersecting)), { threshold: 0.25 }).observe(app) }
})()
