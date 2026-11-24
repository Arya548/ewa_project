export default async function handler(req, res) {
  const base = process.env.BACKEND_URL;
  res.setHeader('Cache-Control', 'no-store');
  if (!base) return res.status(503).json({message: 'Backend hosting is not configured.'});
  const incoming = new URL(req.url, 'https://placeholder.invalid');
  const route = String(req.query.route || '');
  if (!route || route.split('/').some(s => s === '..' || s === '.') || /[\\?#%]/.test(route)) return res.status(400).json({message:'Invalid API path.'});
  incoming.searchParams.delete('route');
  const target = new URL('/api/' + route, base);
  target.search = incoming.searchParams.toString();
  const method = req.method || 'GET';
  if (!['GET','HEAD','OPTIONS'].includes(method) && req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({message:'Invalid request origin.'});
    } catch { return res.status(403).json({message:'Invalid request origin.'}); }
  }
  const headers = {};
  for (const name of ['accept','content-type','cookie']) if (req.headers[name]) headers[name] = req.headers[name];
  try {
    const body = ['GET','HEAD'].includes(method) || req.body == null ? undefined : typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
    const upstream = await fetch(target, {method, headers, body, redirect:'manual', signal:AbortSignal.timeout(20000)});
    const cookies = upstream.headers.getSetCookie();
    if (cookies.length) res.setHeader('Set-Cookie', cookies.map(c => c.replace(/;\s*Domain=[^;]+/gi,'') + (/;\s*Secure(?:;|$)/i.test(c) ? '' : '; Secure')));
    const type = upstream.headers.get('content-type');
    if (type) res.setHeader('Content-Type', type);
    res.status(upstream.status);
    if (method === 'HEAD' || [204,304].includes(upstream.status)) return res.end();
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    return res.status(502).json({message:'Java backend is unavailable. Please try again.'});
  }
}
