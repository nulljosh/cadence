// ponytail: the api/ handlers are Vercel-style (req, res). Rather than rewrite
// all three for Workers, collect their res calls and hand back a Response.
export function adapt(handler) {
  return async ({ request, env }) => {
    // api/_lib.js reads process.env.GITHUB_TOKEN so it still runs on Vercel.
    // Under nodejs_compat, process.env is read-only until compatibility_date
    // 2025-04-01 (this project is pinned earlier), so assigning to it silently
    // no-ops. Hand the binding over on globalThis instead; _lib.js prefers it.
    // ponytail: same value every request, so cross-request reuse is harmless.
    globalThis.__ghToken = env.GITHUB_TOKEN;
    const headers = new Headers({ 'Content-Type': 'application/json' });
    let status = 200;
    let body = null;

    const res = {
      setHeader: (k, v) => headers.set(k, v),
      status(code) { status = code; return this; },
      json(payload) { body = JSON.stringify(payload); return this; },
    };

    try {
      await handler(request, res);
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers,
      });
    }
    return new Response(body, { status, headers });
  };
}
