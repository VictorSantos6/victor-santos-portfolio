import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import handler, { upstreamUrl } from '../api/[...path].js'

afterEach(() => vi.restoreAllMocks())

function request(path: string, options: { method?: string; body?: string; headers?: Record<string, string> } = {}) {
  const stream = Readable.from(options.body ? [options.body] : []) as Readable & {
    url: string
    method: string
    headers: Record<string, string>
  }
  stream.url = path
  stream.method = options.method || 'GET'
  stream.headers = options.headers || {}
  return stream
}

function response() {
  const headers = new Map<string, unknown>()
  let body = Buffer.alloc(0)
  return {
    statusCode: 200,
    headers,
    setHeader(name: string, value: unknown) { headers.set(name.toLowerCase(), value) },
    end(value?: Uint8Array | string) { body = value ? Buffer.from(value) : Buffer.alloc(0) },
    get body() { return body },
  }
}

describe('Vercel portfolio API bridge', () => {
  it('keeps API paths and query parameters on the secured upstream', () => {
    expect(upstreamUrl('/api/admin/certification-image?id=certificate-one').toString()).toBe(
      'https://victor-santos-portfolio.deathplayer3434.chatgpt.site/api/admin/certification-image?id=certificate-one',
    )
  })

  it('forwards login data with the upstream origin and returns its session cookie', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ authenticated: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': '__Host-portfolio-admin=session-token; Path=/; HttpOnly; Secure; SameSite=Strict',
      },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const result = response()

    await handler(request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'test-password' }),
      headers: {
        'content-type': 'application/json',
        host: 'portfolio.example',
        origin: 'https://portfolio.example',
      },
    }) as never, result as never)

    const [, init] = fetchMock.mock.calls[0]
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://victor-santos-portfolio.deathplayer3434.chatgpt.site/api/admin/login')
    expect(init.headers.get('origin')).toBe('https://victor-santos-portfolio.deathplayer3434.chatgpt.site')
    expect(Buffer.from(init.body).toString()).toBe(JSON.stringify({ password: 'test-password' }))
    expect(result.statusCode).toBe(200)
    expect(result.headers.get('set-cookie')).toEqual([
      '__Host-portfolio-admin=session-token; Path=/; HttpOnly; Secure; SameSite=Strict',
    ])
  })

  it('rejects cross-origin admin mutations before contacting the upstream', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = response()

    await handler(request('/api/admin/publish', {
      method: 'POST',
      headers: { host: 'portfolio.example', origin: 'https://attacker.example' },
    }) as never, result as never)

    expect(result.statusCode).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
