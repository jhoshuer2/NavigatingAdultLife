// Small helpers for web-standard (Request/Response) handlers, as used by Vercel Functions.
export const MAX_BODY = 128 * 1024

export function allowedOrigins(): string[] {
  return (process.env.GAME_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

/** CORS for the game origin only (PRD section 6). Unknown origins get no CORS headers, so browsers block them. */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')
  const list = allowedOrigins()
  if (!origin || !list.includes(origin)) return {}
  return { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400', vary: 'origin' }
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } })

export async function readJson(req: Request): Promise<{ ok: true; body: unknown } | { ok: false; status: number }> {
  const len = Number(req.headers.get('content-length') ?? 0)
  if (len > MAX_BODY) return { ok: false, status: 413 }
  const text = await req.text()
  if (text.length > MAX_BODY) return { ok: false, status: 413 }
  try { return { ok: true, body: JSON.parse(text) } } catch { return { ok: false, status: 400 } }
}
