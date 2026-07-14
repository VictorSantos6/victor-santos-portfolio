import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const serverDir = path.join(process.cwd(), 'dist', 'server')
const workerPath = path.join(serverDir, 'index.js')

const workerSource = `const immutableAssetPattern = /\\/assets\\/.+\\.[a-zA-Z0-9]+\\.(?:js|css|png|jpg|jpeg|webp|gif|svg|woff2?)$/;

function withHeaders(response, pathname) {
  const headers = new Headers(response.headers);

  if (immutableAssetPattern.test(pathname)) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'public, max-age=300');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404 || url.pathname.includes('.')) {
      return withHeaders(response, url.pathname);
    }

    const fallbackUrl = new URL('/', url);
    const fallbackResponse = await env.ASSETS.fetch(new Request(fallbackUrl, request));
    return withHeaders(fallbackResponse, '/');
  },
};
`

await mkdir(serverDir, { recursive: true })
await writeFile(workerPath, workerSource)
