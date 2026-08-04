import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const projectDir = process.cwd()
const distDir = path.join(projectDir, 'dist')
const serverDir = path.join(distDir, 'server')
const workerPath = path.join(serverDir, 'index.js')

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'], ['.gif', 'image/gif'], ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'], ['.jpeg', 'image/jpeg'], ['.jpg', 'image/jpg'], ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.pdf', 'application/pdf'], ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'], ['.webp', 'image/webp'], ['.woff', 'font/woff'], ['.woff2', 'font/woff2'],
])

async function collectFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name === 'server' || entry.name === '.openai') continue
    const relativePath = path.posix.join(prefix, entry.name)
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collectFiles(absolutePath, relativePath))
    else files.push({
      path: `/${relativePath}`,
      contentType: contentTypes.get(path.extname(entry.name)) ?? 'application/octet-stream',
      body: (await readFile(absolutePath)).toString('base64'),
    })
  }
  return files
}

const [assets, workerTemplate, portfolio] = await Promise.all([
  collectFiles(distDir),
  readFile(path.join(projectDir, 'worker', 'index.js'), 'utf8'),
  readFile(path.join(projectDir, 'src', 'data', 'portfolio.json'), 'utf8').then(JSON.parse),
])

const workerSource = workerTemplate
  .replace('/*__ASSET_ENTRIES__*/[]', JSON.stringify(assets.map((asset) => [asset.path, { contentType: asset.contentType, body: asset.body }])))
  .replace('/*__DEFAULT_PORTFOLIO__*/{}', JSON.stringify(portfolio))

await mkdir(serverDir, { recursive: true })
await writeFile(workerPath, workerSource)
