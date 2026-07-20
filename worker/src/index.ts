import { createLayoutDocument, LayoutGenerationError } from './zhipu'

interface Env {
  ZHIPU_API_KEY: string
  ALLOWED_ORIGINS: string
}

const MAX_SOURCE_LENGTH = 50_000

function allowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get('Origin')
  if (!origin) return null
  const allowed = new Set(env.ALLOWED_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean))
  return allowed.has(origin) ? origin : null
}

function responseHeaders(origin: string | null) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Headers', 'Content-Type')
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    headers.set('Vary', 'Origin')
  }
  return headers
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(origin) })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = allowedOrigin(request, env)

    if (request.method === 'OPTIONS') {
      return origin ? new Response(null, { status: 204, headers: responseHeaders(origin) }) : json({ error: 'Origin not allowed' }, 403, null)
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json({ status: 'ok' }, 200, origin)
    }

    if (request.method !== 'POST' || url.pathname !== '/api/layout') {
      return json({ error: 'Not found' }, 404, origin)
    }

    if (request.headers.has('Origin') && !origin) {
      return json({ error: 'Origin not allowed' }, 403, null)
    }

    let sourceText = ''
    try {
      const body = await request.json() as { sourceText?: unknown }
      if (typeof body.sourceText === 'string') sourceText = body.sourceText
    } catch {
      return json({ error: 'Invalid request' }, 400, origin)
    }

    if (!sourceText.trim() || sourceText.length > MAX_SOURCE_LENGTH) {
      return json({ error: 'Source text must contain 1 to 50000 characters' }, 400, origin)
    }

    if (!env.ZHIPU_API_KEY) {
      return json({ error: 'Service is not configured' }, 503, origin)
    }

    try {
      const document = await createLayoutDocument(sourceText, env.ZHIPU_API_KEY)
      return json(document, 200, origin)
    } catch (error) {
      const code = error instanceof LayoutGenerationError ? error.code : error instanceof Error && error.name === 'TimeoutError' ? 'upstream_timeout' : 'unknown'
      console.error('Layout generation failed', code)
      return json({ error: 'Layout generation failed', code }, 502, origin)
    }
  },
}
