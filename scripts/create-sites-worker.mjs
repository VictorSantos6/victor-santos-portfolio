import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const distDir = path.join(process.cwd(), 'dist')
const serverDir = path.join(process.cwd(), 'dist', 'server')
const workerPath = path.join(serverDir, 'index.js')

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
])

async function collectFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name === 'server' || entry.name === '.openai') continue

    const relativePath = path.posix.join(prefix, entry.name)
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath, relativePath))
      continue
    }

    const extension = path.extname(entry.name)
    const contentType = contentTypes.get(extension) ?? 'application/octet-stream'
    const body = await readFile(absolutePath)

    files.push({
      path: `/${relativePath}`,
      contentType,
      body: body.toString('base64'),
    })
  }

  return files
}

const files = await collectFiles(distDir)
const workerSource = `const files = new Map(${JSON.stringify(files.map((file) => [
  file.path,
  { contentType: file.contentType, body: file.body },
]))});

const immutableAssetPattern = /\\/assets\\/.+\\.[a-zA-Z0-9]+\\.(?:js|css|png|jpg|jpeg|webp|gif|svg|woff2?)$/;

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function buildResponse(asset, pathname, method) {
  const headers = new Headers({
    'Content-Type': asset.contentType,
  });

  if (immutableAssetPattern.test(pathname)) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    headers.set('Cache-Control', 'public, max-age=300');
  }

  return new Response(method === 'HEAD' ? null : decodeBase64(asset.body), { headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    const asset = files.get(pathname);

    if (asset) {
      return buildResponse(asset, pathname, request.method);
    }

    if (!pathname.includes('.')) {
      return buildResponse(files.get('/index.html'), '/index.html', request.method);
    }

    return new Response(null, { status: 404 });
  },
};
`

await mkdir(serverDir, { recursive: true })
await writeFile(workerPath, workerSource)
