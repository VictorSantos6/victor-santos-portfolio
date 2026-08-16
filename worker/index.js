const files = new Map(/*__ASSET_ENTRIES__*/[])
const defaultPortfolio = /*__DEFAULT_PORTFOLIO__*/{}
const bundledCertifications = [{
  id: 'responsible-conduct-research-engineers',
  name: 'Responsible Conduct of Research for Engineers',
  issuer: 'CITI Program',
  issued: 'February 1, 2026',
  detail: 'Stage 1 · University of Puerto Rico Mayagüez (UPRM)',
  credentialId: '74865898',
  verificationUrl: 'https://www.citiprogram.org/verify/?wfb022f7c-0619-4132-b691-a9551db6cc47-74865898',
  imageKey: null,
  imageName: 'Victor_Santos_CITI_Responsible_Conduct_of_Research.webp',
}]

const SESSION_COOKIE = '__Host-portfolio-admin'
const SESSION_TTL_SECONDS = 12 * 60 * 60
const LOGIN_WINDOW_SECONDS = 15 * 60
const LOGIN_LOCK_SECONDS = 30 * 60
const LOGIN_MAX_FAILURES = 5
const LOGIN_REQUESTS_PER_MINUTE = 10
const PUBLIC_REQUESTS_PER_MINUTE = 300
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const MAX_RATE_LIMIT_BUCKETS = 5000
const MAX_RESUME_BYTES = 10 * 1024 * 1024
const MAX_CERTIFICATE_IMAGE_BYTES = 10 * 1024 * 1024
const PBKDF2_ITERATIONS = 100000
const PUBLIC_DATA_CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
const PUBLIC_MEDIA_CACHE = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
const APP_SHELL_CACHE = 'public, max-age=300'
const encoder = new TextEncoder()
const rateLimitBuckets = new Map()

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

function rateLimitResponse(request, scope, limit, now = Date.now()) {
  const address = request.headers.get('CF-Connecting-IP')
  if (!address) return null

  const key = `${scope}:${address}`
  let bucket = rateLimitBuckets.get(key)
  if (!bucket || now >= bucket.resetAt) bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
  bucket.count += 1
  rateLimitBuckets.set(key, bucket)

  if (rateLimitBuckets.size > MAX_RATE_LIMIT_BUCKETS) {
    for (const [bucketKey, value] of rateLimitBuckets) {
      if (now >= value.resetAt || rateLimitBuckets.size > MAX_RATE_LIMIT_BUCKETS) rateLimitBuckets.delete(bucketKey)
    }
  }

  if (bucket.count <= limit) return null
  return json({ error: 'Too many requests. Try again shortly.' }, 429, {
    'Retry-After': String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))),
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
  const certificationIds = new Set()
  list('certifications', value.certifications, 30).forEach((item, index) => {
    const path = `certifications.${index}`
    if (!isRecord(item)) return void (errors[path] = 'Certification is invalid.')
    for (const key of ['id', 'name', 'issuer', 'issued', 'detail', 'credentialId', 'verificationUrl', 'imageName']) required(`${path}.${key}`, item[key], key === 'verificationUrl' ? 500 : 240)
    if (typeof item.id === 'string') {
      if (!slugPattern.test(item.id)) errors[`${path}.id`] = 'Use lowercase letters, numbers, and hyphens.'
      if (certificationIds.has(item.id)) errors[`${path}.id`] = 'Each certification ID must be unique.'
      certificationIds.add(item.id)
    }
    try {
      if (new URL(item.verificationUrl).protocol !== 'https:') throw new Error()
    } catch {
      errors[`${path}.verificationUrl`] = 'Use a valid HTTPS URL.'
    }
    if (item.imageKey !== null && typeof item.imageKey !== 'string') errors[`${path}.imageKey`] = 'Certificate image reference is invalid.'
  })
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

function normalizePortfolio(content) {
  if (Array.isArray(content.certifications)) return content
  return { ...content, certifications: structuredClone(defaultPortfolio.certifications || bundledCertifications) }
}

function parseRevision(row) {
  return {
    id: row.id,
    content: normalizePortfolio(JSON.parse(row.content_json)),
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}

async function normalizeRevision(db, row) {
  const content = JSON.parse(row.content_json)
  if (Array.isArray(content.certifications)) return row
  const normalizedJson = JSON.stringify(normalizePortfolio(content))
  await db.prepare('UPDATE portfolio_revisions SET content_json = ? WHERE id = ?').bind(normalizedJson, row.id).run()
  return { ...row, content_json: normalizedJson }
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
  const row = await db.prepare("SELECT * FROM portfolio_revisions WHERE status = 'published' ORDER BY published_at DESC, id DESC LIMIT 1").first()
  return normalizeRevision(db, row)
}

async function draftRevision(db) {
  await seedPublished(db)
  let row = await db.prepare("SELECT * FROM portfolio_revisions WHERE status = 'draft' LIMIT 1").first()
  if (row) return normalizeRevision(db, row)
  const published = await publishedRevision(db)
  const now = new Date().toISOString()
  await db.prepare("INSERT INTO portfolio_revisions (status, content_json, created_at, updated_at, published_at) VALUES ('draft', ?, ?, ?, NULL)")
    .bind(published.content_json, now, now).run()
  row = await db.prepare("SELECT * FROM portfolio_revisions WHERE status = 'draft' LIMIT 1").first()
  return normalizeRevision(db, row)
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
    const rateLimited = rateLimitResponse(request, 'public-storage', PUBLIC_REQUESTS_PER_MINUTE)
    if (rateLimited) return rateLimited
    if (!env.DB) return json(defaultPortfolio, 200, { 'Cache-Control': PUBLIC_DATA_CACHE })
    try {
      const row = await publishedRevision(env.DB)
      return json(normalizePortfolio(JSON.parse(row.content_json)), 200, { 'Cache-Control': PUBLIC_DATA_CACHE })
    } catch {
      return json(defaultPortfolio, 200, { 'Cache-Control': PUBLIC_DATA_CACHE })
    }
  }

  if (pathname === '/api/admin/session' && request.method === 'GET') {
    return json({ authenticated: await validSession(request, env) })
  }

  if (pathname === '/api/admin/login' && request.method === 'POST') {
    if (!sameOrigin(request)) return json({ error: 'Request origin was rejected.' }, 403)
    const rateLimited = rateLimitResponse(request, 'admin-login', LOGIN_REQUESTS_PER_MINUTE)
    if (rateLimited) return rateLimited
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

  if (pathname === '/api/admin/certification-image' && request.method === 'GET') {
    const certificationId = new URL(request.url).searchParams.get('id') || ''
    const row = await draftRevision(env.DB)
    const content = normalizePortfolio(JSON.parse(row.content_json))
    const certification = content.certifications.find((item) => item.id === certificationId)
    if (!certification) return json({ error: 'Certification not found.' }, 404)
    if (certification.imageKey && env.R2) {
      const object = await env.R2.get(certification.imageKey)
      if (object) return certificateImageResponse(object, request.method)
    }
    return serveAsset(`/certifications/${certification.id}.webp`, request.method) || new Response(null, { status: 404 })
  }

  if (pathname === '/api/admin/certification-image' && request.method === 'PUT') {
    if (!env.R2) return json({ error: 'Certificate image storage is unavailable.' }, 503)
    const certificationId = new URL(request.url).searchParams.get('id') || ''
    const current = await draftRevision(env.DB)
    const content = normalizePortfolio(JSON.parse(current.content_json))
    const certification = content.certifications.find((item) => item.id === certificationId)
    if (!certification) return json({ error: 'Save this certification before uploading its image.' }, 404)
    const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase()
    if (!['image/webp', 'image/png', 'image/jpeg'].includes(contentType)) return json({ error: 'Choose a WEBP, PNG, or JPEG image.' }, 415)
    const declaredLength = Number(request.headers.get('Content-Length') || 0)
    if (declaredLength > MAX_CERTIFICATE_IMAGE_BYTES) return json({ error: 'The image must be 10 MB or smaller.' }, 413)
    const bytes = new Uint8Array(await request.arrayBuffer())
    if (!bytes.length || bytes.length > MAX_CERTIFICATE_IMAGE_BYTES) return json({ error: 'The image must be between 1 byte and 10 MB.' }, 413)
    if (!validImageSignature(bytes, contentType)) return json({ error: 'The file signature does not match the selected image type.' }, 415)
    const extension = contentType === 'image/png' ? 'png' : contentType === 'image/jpeg' ? 'jpg' : 'webp'
    const requestedName = decodeURIComponent(request.headers.get('X-File-Name') || `certificate.${extension}`).replace(/[^a-zA-Z0-9._ -]/g, '').slice(0, 180)
    const fileName = requestedName || `certificate.${extension}`
    const key = `certifications/${crypto.randomUUID()}.${extension}`
    await env.R2.put(key, bytes, { httpMetadata: { contentType } })
    certification.imageKey = key
    certification.imageName = fileName
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
  const cacheControl = immutableAssetPattern.test(pathname)
    ? 'public, max-age=31536000, immutable'
    : pathname === '/index.html' ? APP_SHELL_CACHE : PUBLIC_MEDIA_CACHE
  headers.set('Cache-Control', cacheControl)
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
            'Cache-Control': PUBLIC_MEDIA_CACHE,
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

function validImageSignature(bytes, contentType) {
  if (contentType === 'image/png') return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
  if (contentType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
}

function certificateImageResponse(object, method, cacheControl = 'no-store') {
  const headers = new Headers({
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
  })
  return new Response(method === 'HEAD' ? null : object.body, { headers })
}

async function serveCertificateImage(env, certificationId, method) {
  if (env.DB) {
    try {
      const row = await publishedRevision(env.DB)
      const content = normalizePortfolio(JSON.parse(row.content_json))
      const certification = content.certifications.find((item) => item.id === certificationId)
      if (!certification) return new Response(null, { status: 404 })
      if (certification.imageKey && env.R2) {
        const object = await env.R2.get(certification.imageKey)
        if (object) return certificateImageResponse(object, method, PUBLIC_MEDIA_CACHE)
      }
      return serveAsset(`/certifications/${certification.id}.webp`, method) || new Response(null, { status: 404 })
    } catch {
      // Use the bundled image while storage is unavailable.
    }
  }
  return serveAsset(`/certifications/${certificationId}.webp`, method) || new Response(null, { status: 404 })
}

export { normalizePortfolio, validatePortfolio, validImageSignature, verifyPassword, validSession }

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url.pathname)
    if (url.pathname === '/resume') {
      const rateLimited = rateLimitResponse(request, 'public-storage', PUBLIC_REQUESTS_PER_MINUTE)
      return rateLimited || serveResume(env, request.method)
    }
    const certificateMatch = url.pathname.match(/^\/certifications\/([a-z0-9]+(?:-[a-z0-9]+)*)\/image$/)
    if (certificateMatch) {
      const rateLimited = rateLimitResponse(request, 'public-storage', PUBLIC_REQUESTS_PER_MINUTE)
      return rateLimited || serveCertificateImage(env, certificateMatch[1], request.method)
    }
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname
    const asset = serveAsset(pathname, request.method)
    if (asset) return asset
    if (!pathname.includes('.')) return serveAsset('/index.html', request.method)
    return new Response(null, { status: 404 })
  },
}
