// Everything brand-specific lives here. The page copy uses [[TOKENS]] that brandify() fills in before first paint;
// hl.js reads window.PAD for the live parts. Change the brand here and nowhere else (plus <title>/meta in index.html,
// which crawlers read before any script runs).
window.PAD = {
  brand: 'HyperRoot',            // product name
  ticker: 'ROOT',                // the quote coin's ticker, without $
  wordmark: 'hyperroot',         // the big rounded wordmark on the first screen
  mark: 'r',                     // the letter in the small square logo
  suffix: 'root',                // every launch's CA ends in this (ground on the relay: VANITY_SUFFIX)
  quoteMint: '',                 // the $ROOT mint, once launched (empty = "CA soon" everywhere)
  quoteName: 'HYPE',             // what $ROOT itself is paired with on pump.fun
  accent: '#97fce4',             // brand mint: logo square, links, highlights
  x: '',                         // X handle without @ (empty = no X link yet)
  domain: '',                    // e.g. hyperroot.fun (used for display only)
  burnPct: 10, creatorPct: 90,   // the creator-fee split set at every launch
  holderMin: 1000000,            // $ROOT a wallet needs for the holder perks (placeholder)
  buyback: '9n3F7d2MxB8pPmXTghoVdvqVyaXkkCiTcg149wUygbX1',   // gets burnPct of every creator fee (in $ROOT) and burns it
  logo: 'assets/coin-256.png',   // the $ROOT coin (art/ticker.png), used wherever the mark appears
}

// fill [[TOKENS]] in text and in href / alt / placeholder / title / aria-label attributes
window.brandify = function brandify(root = document.body) {
  const P = window.PAD, ca = P.quoteMint
  const T = {
    BRAND: P.brand, TICKER: P.ticker, WORDMARK: P.wordmark, MARK: P.mark, SUFFIX: P.suffix, QUOTE: P.quoteName,
    CA: ca || 'CA soon', PUMPURL: ca ? `https://pump.fun/coin/${ca}` : '#token', DEXURL: ca ? `https://dexscreener.com/solana/${ca}` : '#token',
    XURL: P.x ? `https://x.com/${P.x}` : '#token', BURN: String(P.burnPct), CREATOR: String(P.creatorPct), HOLDMIN: P.holderMin.toLocaleString('en-US'),
  }
  const fill = (s) => s.replace(/\[\[([A-Z]+)\]\]/g, (m, k) => (k in T ? T[k] : m))
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n; (n = walk.nextNode()); ) if (n.nodeValue.includes('[[')) n.nodeValue = fill(n.nodeValue)
  for (const el of root.querySelectorAll('[href*="[["],[alt*="[["],[placeholder*="[["],[title*="[["],[aria-label*="[["]'))
    for (const a of ['href', 'alt', 'placeholder', 'title', 'aria-label']) { const v = el.getAttribute(a); if (v && v.includes('[[')) el.setAttribute(a, fill(v)) }
  document.documentElement.style.setProperty('--mint', P.accent)
  if (P.logo) root.querySelectorAll('.bm').forEach((el) => { el.textContent = ''; el.classList.add('img'); const i = new Image(); i.src = P.logo; i.alt = ''; el.appendChild(i) })
  if (!ca) document.querySelectorAll('[data-needs-ca]').forEach((el) => el.classList.add('soon'))
}
