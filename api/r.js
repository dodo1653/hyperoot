// The page's door to the relay: live state and coin pages are cached a moment; launches, links and binds pass straight through.
import { RELAY_BASE } from './_relay.js'
export const config = { runtime: 'edge' }
const GETS = { pad: 3, coin: 4, mint: -1, vanity: 5 }   // -1: never cached
const POSTS = new Set(['upload', 'send'])
const J = { 'content-type': 'application/json' }
export default async function handler(req) {
  const u = new URL(req.url), path = u.searchParams.get('path')
  if (req.method === 'POST' && POSTS.has(path)) {
    const r = await fetch(`${RELAY_BASE}/v1/${path}`, { method: 'POST', headers: J, body: await req.text() }).catch(() => null)
    if (!r) return new Response('{"error":"the relay is offline, try again in a minute"}', { status: 502, headers: J })
    return new Response(r.body, { status: r.status, headers: { ...J, 'cache-control': 'no-store' } })
  }
  if (req.method === 'GET' && GETS[path]) {
    u.searchParams.delete('path')
    const r = await fetch(`${RELAY_BASE}/v1/${path}?${u.searchParams}`, { cache: 'no-store' }).catch(() => null)
    if (!r) return new Response('{"error":"relay offline"}', { status: 502, headers: { ...J, 'cache-control': 'no-store' } })
    return new Response(r.body, { status: r.status, headers: { ...J, 'cache-control': r.ok && GETS[path] > 0 ? `public, s-maxage=${GETS[path]}, stale-while-revalidate=10` : 'no-store' } })
  }
  return new Response('{"error":"unknown"}', { status: 404, headers: J })
}
