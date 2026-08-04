const files = new Map(/*__ASSET_ENTRIES__*/[])
const defaultPortfolio = /*__DEFAULT_PORTFOLIO__*/{}

const SESSION_COOKIE = '__Host-portfolio-admin'
const SESSION_TTL_SECONDS = 12 * 60 * 60
const LOGIN_WINDOW_SECONDS = 15 * 60
const LOGIN_LOCK_SECONDS = 30 * 60
const LOGIN_MAX_FAILURES = 5
const MAX_RESUME_BYTES = 10 * 1024 * 1024
const PBKDF2_ITERATIONS = 100000
const encoder = new TextEncoder()

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  })
}

function base64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', fromBase64(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)))
}

async function verifyPassword(password, env) {
  if (!env.ADMIN_PASSWORD_SALT || !env.ADMIN_PASSWORD_HASH) return false
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derived = new Uint8Array(await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: fromBase64(env.ADMIN_PASSWORD_SALT),
    iterations: PBKDF2_ITERATIONS,
  }, key, 256))
  return constantTimeEqual(derived, fromBase64(env.ADMIN_PASSWORD_HASH))
}

async function createSession(env) {
  const now = Math.floor(Date.now() / 1000)
  const payload = base64Url(encoder.encode(JSON.stringify({ iat: now, exp: now + SESSION_TTL_SECONDS, nonce: crypto.randomUUID() })))
  const signature = base64Url(await hmac(env.ADMIN_SESSION_SECRET, payload))
  return `${payload}.${signature}`
}

function cookies(request) {
  const result = {}
  for (const pair of (request.headers.get('Cookie') || '').split(';')) {
    const separator = pair.indexOf('=')
    if (separator > 0) result[pair.slice(0, separator).trim()] = pair.slice(separator + 1).trim()
  }
  return result
}

async function validSession(request, env) {
  if (!env.ADMIN_SESSION_SECRET) return false
  const token = cookies(request)[SESSION_COOKIE]
  if (!token) return false
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) return false
  const expected = base64Url(await hmac(env.ADMIN_SESSION_SECRET, payload))
  if (!constantTimeEqual(encoder.encode(signature), encoder.encode(expected))) return false
  try {
    const decoded = JSON.parse(new TextDecoder().decode(fromBase64(payload)))
    const now = Math.floor(Date.now() / 1000)
    return Number.isFinite(decoded.iat) && decoded.iat <= now + 60 && decoded.exp > now && decoded.exp - decoded.iat <= SESSION_TTL_SECONDS
  } catch {
    return false
  }
}

function sameOrigin(request) {
  const origin = request.headers.get('Origin')
  return Boolean(origin) && origin === new URL(request.url).origin
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function validatePortfolio(value) {
  const errors = {}
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const required = (path, input, max = 500) => {
    if (typeof input !== 'string' || !input.trim()) errors[path] = 'This field is required.'
    else if (input.length > max) errors[path] = `Keep this under ${max} characters.`
    else if (/[<>]/.test(input)) errors[path] = 'HTML is not allowed.'
  }
  const list = (path, input, max) => {
    if (!Array.isArray(input)) {
      errors[path] = 'This must be a list.'
      return []
    }
    if (input.length > max) errors[path] = `Use no more than ${max} items.`
    return input
  }
  if (!isRecord(value)) return { content: 'Portfolio content is invalid.' }
  if (!isRecord(value.identity)) errors.identity = 'Identity details are required.'
  else for (const key of ['name', 'role', 'kicker', 'headlineLead', 'headlineMiddle', 'headlineEmphasis', 'summary', 'building', 'status', 'location']) required(`identity.${key}`, value.identity[key], key === 'summary' ? 1000 : 180)
  if (!isRecord(value.education)) errors.education = 'Education details are required.'
  else {
    for (const key of ['institution', 'location', 'degree', 'graduation', 'gpa']) required(`education.${key}`, value.education[key], 240)
    list('education.coursework', value.education.coursework, 30).forEach((entry, index) => required(`education.coursework.${index}`, entry, 180))
  }
  required('experienceIntro', value.experienceIntro, 1000)
  const experienceIds = new Set()
  list('experiences', value.experiences, 30).forEach((item, index) => {
    const path = `experiences.${index}`
    if (!isRecord(item)) return void (errors[path] = 'Experience is invalid.')
    for (const key of ['id', 'organization', 'role', 'location', 'period', 'eyebrow', 'summary']) required(`${path}.${key}`, item[key], key === 'summary' ? 1000 : 240)
    if (typeof item.id === 'string') {
      if (!slugPattern.test(item.id)) errors[`${path}.id`] = 'Use lowercase letters, numbers, and hyphens.'
      if (experienceIds.has(item.id)) errors[`${path}.id`] = 'Each experience ID must be unique.'
      experienceIds.add(item.id)
    }
    list(`${path}.highlights`, item.highlights, 20).forEach((entry, entryIndex) => required(`${path}.highlights.${entryIndex}`, entry, 500))
    if (item.impact !== undefined) list(`${path}.impact`, item.impact, 4).forEach((impact, impactIndex) => {
      if (!isRecord(impact)) errors[`${path}.impact.${impactIndex}`] = 'Impact is invalid.'
      else {
        required(`${path}.impact.${impactIndex}.value`, impact.value, 30)
        required(`${path}.impact.${impactIndex}.label`, impact.label, 80)
      }
    })
  })
  required('projectsIntro', value.projectsIntro, 1000)
  const projectIds = new Set()
  list('projects', value.projects, 40).forEach((item, index) => {
    const path = `projects.${index}`
    if (!isRecord(item)) return void (errors[path] = 'Project is invalid.')
    for (const key of ['id', 'name', 'period', 'signal', 'problem', 'contribution']) required(`${path}.${key}`, item[key], ['problem', 'contribution'].includes(key) ? 1200 : 240)
    if (typeof item.id === 'string') {
      if (!slugPattern.test(item.id)) errors[`${path}.id`] = 'Use lowercase letters, numbers, and hyphens.'
      if (projectIds.has(item.id)) errors[`${path}.id`] = 'Each project ID must be unique.'
      projectIds.add(item.id)
    }
    if (!['cyan', 'blue', 'amber', 'violet'].includes(item.accent)) errors[`${path}.accent`] = 'Choose an available accent.'
    list(`${path}.stack`, item.stack, 20).forEach((entry, entryIndex) => required(`${path}.stack.${entryIndex}`, entry, 80))
    list(`${path}.outcomes`, item.outcomes, 20).forEach((entry, entryIndex) => required(`${path}.outcomes.${entryIndex}`, entry, 300))
  })
  list('skillGroups', value.skillGroups, 20).forEach((item, index) => {
    const path = `skillGroups.${index}`
    if (!isRecord(item)) return void (errors[path] = 'Skill group is invalid.')
    required(`${path}.label`, item.label, 80)
    list(`${path}.skills`, item.skills, 30).forEach((entry, entryIndex) => required(`${path}.skills.${entryIndex}`, entry, 80))
  })
  if (!isRecord(value.contact)) errors.contact = 'Contact details are required.'
  else {
    required('contact.email', value.contact.email, 254)
    if (typeof value.contact.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.contact.email)) errors['contact.email'] = 'Enter a valid email address.'
    required('contact.linkedin', value.contact.linkedin, 500)
    try {
      if (new URL(value.contact.linkedin).protocol !== 'https:') throw new Error()
    } catch {
      errors['contact.linkedin'] = 'Use a valid HTTPS URL.'
    }
    required('contact.intro', value.contact.intro, 1000)
    required('contact.resumeName', value.contact.resumeName, 180)
    if (value.contact.resumeKey !== null && typeof value.contact.resumeKey !== 'string') errors['contact.resumeKey'] = 'Résumé reference is invalid.'
  }
  return errors
}

function parseRevision(row) {
  return {
    id: row.id,
    content: JSON.parse(row.content_json),
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}

async function seedPublished(db) {
  const row = await db.prepare("SELECT id FROM portfolio_revisions WHERE status = 'published' LIMIT 1").first()
  if (row) return
  const now = new Date().toISOString()
  await db.prepare("INSERT INTO portfolio_revisions (status, content_json, created_at, updated_at, published_at) VALUES ('published', ?, ?, ?, ?)")
    .bind(JSON.stringify(defaultPortfolio), now, now, now).run()
}

async function publishedRevision(db) {
  await seedPublished(db)
  return db.prepare("SELECT * FROM portfolio_revisions WHERE status = 'published' ORDER BY published_at DESC, id DESC LIMIT 1").first()
}

async function draftRevision(db) {
  await seedPublished(db)
  let row = await db.prepare("SELECT * FROM portfolio_revisions WHERE status = 'draft' LIMIT 1").first()
  if (row) return row
  const published = await publishedRevision(db)
  const now = new Date().toISOString()
  await db.prepare("INSERT INTO portfolio_revisions (status, content_json, created_at, updated_at, published_at) VALUES ('draft', ?, ?, ?, NULL)")
    .bind(published.content_json, now, now).run()
  row = await db.prepare("SELECT * FROM portfolio_revisions WHERE status = 'draft' LIMIT 1").first()
  return row
}

async function requireAdmin(request, env) {
  if (!await validSession(request, env)) return json({ error: 'Sign in to continue.' }, 401)
  return null
}

async function loginFingerprint(request, env) {
  const address = request.headers.get('CF-Connecting-IP') || 'unknown'
  return base64Url(await hmac(env.ADMIN_SESSION_SECRET, `login:${address}`))
}

async function loginStatus(db, fingerprint) {
  const now = Math.floor(Date.now() / 1000)
  const row = await db.prepare('SELECT * FROM admin_login_attempts WHERE fingerprint = ?').bind(fingerprint).first()
  if (!row) return { locked: false, now }
  return { locked: Number(row.locked_until) > now, now, row }
}

async function recordLoginFailure(db, fingerprint, status) {
  const { now, row } = status
  const insideWindow = row && now - Number(row.window_started) < LOGIN_WINDOW_SECONDS
  const failedCount = insideWindow ? Number(row.failed_count) + 1 : 1
  const windowStarted = insideWindow ? Number(row.window_started) : now
  const lockedUntil = failedCount >= LOGIN_MAX_FAILURES ? now + LOGIN_LOCK_SECONDS : 0
  await db.prepare(`INSERT INTO admin_login_attempts (fingerprint, window_started, failed_count, locked_until)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(fingerprint) DO UPDATE SET window_started = excluded.window_started, failed_count = excluded.failed_count, locked_until = excluded.locked_until`)
    .bind(fingerprint, windowStarted, failedCount, lockedUntil).run()
}

async function handleApi(request, env, pathname) {
  if (pathname === '/api/portfolio' && request.method === 'GET') {
    if (!env.DB) return json(defaultPortfolio)
    try {
      const row = await publishedRevision(env.DB)
      return json(JSON.parse(row.content_json))
    } catch {
      return json(defaultPortfolio)
    }
  }

  if (pathname === '/api/admin/session' && request.method === 'GET') {
    return json({ authenticated: await validSession(request, env) })
  }

  if (pathname === '/api/admin/login' && request.method === 'POST') {
    if (!sameOrigin(request)) return json({ error: 'Request origin was rejected.' }, 403)
    if (!env.DB || !env.ADMIN_SESSION_SECRET || !env.ADMIN_PASSWORD_SALT || !env.ADMIN_PASSWORD_HASH) return json({ error: 'Admin access has not been configured yet.' }, 503)
    const fingerprint = await loginFingerprint(request, env)
    const status = await loginStatus(env.DB, fingerprint)
    if (status.locked) return json({ error: 'Too many attempts. Try again in 30 minutes.' }, 429)
    const body = await request.json().catch(() => ({}))
    if (typeof body.password !== 'string' || !await verifyPassword(body.password, env)) {
      await recordLoginFailure(env.DB, fingerprint, status)
      return json({ error: 'The password is incorrect.' }, 401)
    }
    await env.DB.prepare('DELETE FROM admin_login_attempts WHERE fingerprint = ?').bind(fingerprint).run()
    const session = await createSession(env)
    return json({ authenticated: true }, 200, {
      'Set-Cookie': `${SESSION_COOKIE}=${session}; Path=/; HttpOnly; Secure; SameSite=Strict`,
    })
  }

  if (pathname === '/api/admin/logout' && request.method === 'POST') {
    if (!sameOrigin(request)) return json({ error: 'Request origin was rejected.' }, 403)
    return json({ authenticated: false }, 200, {
      'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
    })
  }

  const authError = await requireAdmin(request, env)
  if (authError) return authError
  if (!env.DB) return json({ error: 'Portfolio storage is unavailable.' }, 503)
  if (request.method !== 'GET' && !sameOrigin(request)) return json({ error: 'Request origin was rejected.' }, 403)

  if (pathname === '/api/admin/draft' && request.method === 'GET') {
    const row = await draftRevision(env.DB)
    return json({ revision: parseRevision(row) })
  }

  if (pathname === '/api/admin/draft' && request.method === 'PUT') {
    const content = await request.json().catch(() => null)
    const errors = validatePortfolio(content)
    if (Object.keys(errors).length) return json({ error: 'Review the invalid fields.', errors }, 400)
    const current = await draftRevision(env.DB)
    const now = new Date().toISOString()
    await env.DB.prepare("UPDATE portfolio_revisions SET content_json = ?, updated_at = ? WHERE id = ? AND status = 'draft'")
      .bind(JSON.stringify(content), now, current.id).run()
    const row = await env.DB.prepare('SELECT * FROM portfolio_revisions WHERE id = ?').bind(current.id).first()
    return json({ revision: parseRevision(row) })
  }

  if (pathname === '/api/admin/publish' && request.method === 'POST') {
    const current = await draftRevision(env.DB)
    const content = JSON.parse(current.content_json)
    const errors = validatePortfolio(content)
    if (Object.keys(errors).length) return json({ error: 'The draft is invalid and was not published.', errors }, 400)
    const now = new Date().toISOString()
    await env.DB.batch([
      env.DB.prepare("UPDATE portfolio_revisions SET status = 'published', updated_at = ?, published_at = ? WHERE id = ? AND status = 'draft'").bind(now, now, current.id),
      env.DB.prepare("INSERT INTO portfolio_revisions (status, content_json, created_at, updated_at, published_at) VALUES ('draft', ?, ?, ?, NULL)").bind(current.content_json, now, now),
    ])
    const row = await env.DB.prepare("SELECT * FROM portfolio_revisions WHERE status = 'draft' LIMIT 1").first()
    return json({ revision: parseRevision(row), publishedAt: now })
  }

  if (pathname === '/api/admin/resume' && request.method === 'GET') {
    const row = await draftRevision(env.DB)
    const contact = JSON.parse(row.content_json).contact
    if (contact.resumeKey && env.R2) {
      const object = await env.R2.get(contact.resumeKey)
      if (object) return new Response(object.body, { headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
    }
    return serveAsset('/Victor-Santos-Resume.pdf', 'GET') || new Response(null, { status: 404 })
  }

  if (pathname === '/api/admin/resume' && request.method === 'PUT') {
    if (!env.R2) return json({ error: 'Résumé storage is unavailable.' }, 503)
    const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase()
    const declaredLength = Number(request.headers.get('Content-Length') || 0)
    if (contentType !== 'application/pdf') return json({ error: 'Choose a PDF file.' }, 415)
    if (declaredLength > MAX_RESUME_BYTES) return json({ error: 'The PDF must be 10 MB or smaller.' }, 413)
    const bytes = new Uint8Array(await request.arrayBuffer())
    if (!bytes.length || bytes.length > MAX_RESUME_BYTES) return json({ error: 'The PDF must be between 1 byte and 10 MB.' }, 413)
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') return json({ error: 'This file does not have a valid PDF signature.' }, 415)
    const requestedName = decodeURIComponent(request.headers.get('X-File-Name') || 'resume.pdf').replace(/[^a-zA-Z0-9._ -]/g, '').slice(0, 180)
    const fileName = requestedName.toLowerCase().endsWith('.pdf') ? requestedName : `${requestedName || 'resume'}.pdf`
    const key = `resumes/${crypto.randomUUID()}.pdf`
    await env.R2.put(key, bytes, { httpMetadata: { contentType: 'application/pdf', contentDisposition: `attachment; filename="${fileName.replace(/"/g, '')}"` } })
    const current = await draftRevision(env.DB)
    const content = JSON.parse(current.content_json)
    content.contact.resumeKey = key
    content.contact.resumeName = fileName
    const now = new Date().toISOString()
    await env.DB.prepare("UPDATE portfolio_revisions SET content_json = ?, updated_at = ? WHERE id = ? AND status = 'draft'")
      .bind(JSON.stringify(content), now, current.id).run()
    const row = await env.DB.prepare('SELECT * FROM portfolio_revisions WHERE id = ?').bind(current.id).first()
    return json({ revision: parseRevision(row) })
  }

  return json({ error: 'Not found.' }, 404)
}

const immutableAssetPattern = /\/assets\/.+\.[a-zA-Z0-9]+\.(?:js|css|png|jpg|jpeg|webp|gif|svg|woff2?)$/

function decodeBase64(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function serveAsset(pathname, method) {
  const asset = files.get(pathname)
  if (!asset) return null
  const headers = new Headers({ 'Content-Type': asset.contentType, 'X-Content-Type-Options': 'nosniff' })
  headers.set('Cache-Control', immutableAssetPattern.test(pathname) ? 'public, max-age=31536000, immutable' : 'public, max-age=300')
  return new Response(method === 'HEAD' ? null : decodeBase64(asset.body), { headers })
}

async function serveResume(env, method) {
  if (env.DB) {
    try {
      const row = await publishedRevision(env.DB)
      const contact = JSON.parse(row.content_json).contact
      if (contact.resumeKey && env.R2) {
        const object = await env.R2.get(contact.resumeKey)
        if (object) return new Response(method === 'HEAD' ? null : object.body, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${contact.resumeName.replace(/"/g, '')}"`,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        })
      }
    } catch {
      // The bundled résumé remains available during a storage outage.
    }
  }
  return serveAsset('/Victor-Santos-Resume.pdf', method) || new Response(null, { status: 404 })
}

export { validatePortfolio, verifyPassword, validSession }

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url.pathname)
    if (url.pathname === '/resume') return serveResume(env, request.method)
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname
    const asset = serveAsset(pathname, request.method)
    if (asset) return asset
    if (!pathname.includes('.')) return serveAsset('/index.html', request.method)
    return new Response(null, { status: 404 })
  },
}
