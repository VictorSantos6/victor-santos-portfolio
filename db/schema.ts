export const portfolioRevisionsTable = `
  CREATE TABLE IF NOT EXISTS portfolio_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    content_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT
  )
`

export const loginAttemptsTable = `
  CREATE TABLE IF NOT EXISTS admin_login_attempts (
    fingerprint TEXT PRIMARY KEY,
    window_started INTEGER NOT NULL,
    failed_count INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER NOT NULL DEFAULT 0
  )
`
