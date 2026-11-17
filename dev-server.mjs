// Local development server: serves public/ and runs the api/ routes, like Vercel does.
// Usage:  node dev-server.mjs   then open http://localhost:3000
// Data is saved to .data/dev-db.json unless SUPABASE_URL is set in .env
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
const PORT = Number(process.env.PORT || 3000);

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z]/g, '');
    const file = `./api/${name}.js`;
    if (!name || !existsSync(file)) { res.statusCode = 404; return res.end('not found'); }
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    req.query = Object.fromEntries(url.searchParams);
    if (process.env.DEV_COUNTRY) req.headers['x-vercel-ip-country'] = process.env.DEV_COUNTRY;
    const mod = await import(file + '?t=' + Date.now());
    return mod.default(req, res);
  }
  let p = normalize(join('public', decodeURIComponent(url.pathname)));
  if (!p.startsWith('public')) { res.statusCode = 403; return res.end(); }
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) p = 'public/index.html';
  res.setHeader('Content-Type', TYPES[extname(p)] || 'application/octet-stream');
  res.end(readFileSync(p));
}).listen(PORT, () => console.log(`Couple calendar running at http://localhost:${PORT}`));
