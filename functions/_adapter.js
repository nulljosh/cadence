// ponytail: the api/ handlers are Vercel-style (req, res). Rather than rewrite
// all three for Workers, collect their res calls and hand back a Response.
export function adapt(handler) {
  return async ({ request }) => {
    // api/_lib.js reads process.env.GITHUB_TOKEN directly; with nodejs_compat
    // the runtime already populates process.env from the Pages bindings.
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
