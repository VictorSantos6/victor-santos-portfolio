const DEFAULT_API_ORIGIN = 'https://victor-santos-portfolio.deathplayer3434.chatgpt.site'
const MAX_PROXY_BODY_BYTES = 10 * 1024 * 1024 + 64 * 1024
const forwardedRequestHeaders = ['accept', 'content-type', 'cookie', 'x-file-name']
const blockedResponseHeaders = new Set(['connection', 'content-encoding', 'content-length', 'keep-alive', 'transfer-encoding'])

export const config = {
  api: {
    bodyParser: false,
  },
}

function apiOrigin() {
  const configured = process.env.PORTFOLIO_API_ORIGIN || DEFAULT_API_ORIGIN
  return configured.replace(/\/$/, '')
}

function sitesAuthorization() {
  const token = process.env.SITES_BYPASS_TOKEN
  return token ? `Bearer ${token}` : null
}

function requestOrigin(request) {
  const forwardedHost = request.headers['x-forwarded-host']
  const forwardedProto = request.headers['x-forwarded-proto']
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || request.headers.host
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || 'https'
  return host ? `${protocol}://${host}` : null
}

function isAllowedAdminRequest(request) {
  if (!request.url?.startsWith('/api/admin/') || request.method === 'GET' || request.method === 'HEAD') return true
  const origin = request.headers.origin
  return typeof origin === 'string' && origin === requestOrigin(request)
}

export function upstreamUrl(requestUrl) {
  const incoming = new URL(requestUrl || '/api/portfolio', 'https://vercel.invalid')
  return new URL(`${incoming.pathname}${incoming.search}`, apiOrigin())
}

async function readBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += bytes.length
    if (size > MAX_PROXY_BODY_BYTES) throw new Error('REQUEST_TOO_LARGE')
    chunks.push(bytes)
  }
  return Buffer.concat(chunks)
}

export default async function handler(request, response) {
  if (!request.url?.startsWith('/api/')) {
    response.statusCode = 404
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ error: 'Not found.' }))
    return
  }

  if (!isAllowedAdminRequest(request)) {
    response.statusCode = 403
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    response.end(JSON.stringify({ error: 'Request origin was rejected.' }))
    return
  }

  try {
    const target = upstreamUrl(request.url)
    const headers = new Headers()
    for (const name of forwardedRequestHeaders) {
      const value = request.headers[name]
      if (typeof value === 'string') headers.set(name, value)
      else if (Array.isArray(value)) headers.set(name, value.join(', '))
    }
    headers.set('Origin', apiOrigin())
    const authorization = sitesAuthorization()
    if (authorization) headers.set('OAI-Sites-Authorization', authorization)

    const method = request.method || 'GET'
    const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(request)
    const upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(25_000),
    })

    response.statusCode = upstream.status
    upstream.headers.forEach((value, name) => {
      if (name === 'set-cookie' || blockedResponseHeaders.has(name)) return
      response.setHeader(name, value)
    })
    const setCookies = typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : upstream.headers.get('set-cookie') ? [upstream.headers.get('set-cookie')] : []
    if (setCookies.length) response.setHeader('Set-Cookie', setCookies)
    response.setHeader('Cache-Control', 'no-store')
    response.end(Buffer.from(await upstream.arrayBuffer()))
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'REQUEST_TOO_LARGE'
    response.statusCode = tooLarge ? 413 : 502
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    response.end(JSON.stringify({ error: tooLarge ? 'The upload is too large.' : 'The portfolio service is temporarily unavailable.' }))
  }
}
