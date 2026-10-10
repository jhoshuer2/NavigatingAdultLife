import { getDb } from './db'
import { corsHeaders, json, readJson } from './http'
import { eraseDevice, ingest } from './ingest'

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function handleCollect(req: Request): Promise<Response> {
  const cors = corsHeaders(req)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: cors })
  const body = await readJson(req)
  if (!body.ok) return new Response(null, { status: body.status, headers: cors })
  try {
    const r = await ingest(await getDb(), body.body, req.headers)
    return new Response(null, { status: r.status, headers: cors })
  } catch (e) {
    console.error('collect failed', (e as Error).message)
    return new Response(null, { status: 500, headers: cors })
  }
}

/** In-game "Delete my statistics": erase by device id. */
export async function handleForget(req: Request): Promise<Response> {
  const cors = corsHeaders(req)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: cors })
  const body = await readJson(req)
  const id = body.ok && typeof (body.body as { device_id?: unknown })?.device_id === 'string' ? (body.body as { device_id: string }).device_id : ''
  if (!uuidRe.test(id)) return json({ error: 'bad device id' }, 400, cors)
  try { await eraseDevice(await getDb(), id); return json({ ok: true }, 200, cors) } catch (e) { console.error('forget failed', (e as Error).message); return json({ error: 'failed' }, 500, cors) }
}
