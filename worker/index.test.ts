import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import worker, { normalizePortfolio, validImageSignature, validSession, validatePortfolio, verifyPassword } from './index.js'
import portfolio from '../src/data/portfolio.json'

function authEnvironment(password = 'a-long-test-password') {
  const salt = randomBytes(24)
  return {
    ADMIN_PASSWORD_SALT: salt.toString('base64'),
    ADMIN_PASSWORD_HASH: pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('base64'),
    ADMIN_SESSION_SECRET: randomBytes(32).toString('base64'),
  }
}

describe('portfolio worker security helpers', () => {
  it('serves the public fallback but rejects anonymous draft access', async () => {
    const publicResponse = await worker.fetch(new Request('https://portfolio.example/api/portfolio'), {})
    expect(publicResponse.status).toBe(200)

    const privateResponse = await worker.fetch(new Request('https://portfolio.example/api/admin/draft'), {})
    expect(privateResponse.status).toBe(401)
    await expect(privateResponse.json()).resolves.toMatchObject({ error: 'Sign in to continue.' })
  })

  it('rejects login mutations without a matching browser origin', async () => {
    const response = await worker.fetch(new Request('https://portfolio.example/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'a-long-test-password' }),
    }), authEnvironment())
    expect(response.status).toBe(403)
  })

  it('accepts the seed and rejects unsafe content', () => {
    expect(validatePortfolio(portfolio)).toEqual({})
    const unsafe = structuredClone(portfolio)
    unsafe.contact.intro = '<b>unsafe</b>'
    expect(validatePortfolio(unsafe)).toHaveProperty('contact.intro', 'HTML is not allowed.')
  })

  it('upgrades legacy snapshots and validates uploaded image signatures', () => {
    const legacy = structuredClone(portfolio) as typeof portfolio & { certifications?: typeof portfolio.certifications }
    delete legacy.certifications
    expect(normalizePortfolio(legacy).certifications).toEqual(portfolio.certifications)
    expect(validImageSignature(new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]), 'image/webp')).toBe(true)
    expect(validImageSignature(new Uint8Array([82, 73, 70, 70]), 'image/webp')).toBe(false)
  })

  it('verifies only the configured PBKDF2 password', async () => {
    const env = authEnvironment()
    await expect(verifyPassword('a-long-test-password', env)).resolves.toBe(true)
    await expect(verifyPassword('wrong-password', env)).resolves.toBe(false)
  })

  it('rejects missing and forged session cookies', async () => {
    const env = authEnvironment()
    await expect(validSession(new Request('https://portfolio.example/api/admin/session'), env)).resolves.toBe(false)
    await expect(validSession(new Request('https://portfolio.example/api/admin/session', {
      headers: { Cookie: '__Host-portfolio-admin=forged.payload' },
    }), env)).resolves.toBe(false)
  })
})
