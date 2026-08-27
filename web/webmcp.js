// WebMCP tool registration for Cadence. Read-only: the app is a dashboard over
// GitHub activity, so there is nothing here for an agent to change.
//
// ponytail: tools hit the same three /api routes the page loads from, so a tool
// answer and the rendered chart come from one source.
(function () {
  const mc = document.modelContext;
  if (!mc?.registerTool) return; // browser without WebMCP support

  const get = async (path) => {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return res.json();
  };

  const TOOLS = [
    {
      name: 'get_commit_stats',
      description: 'Get commit activity: last-30-day total, active project count, best day, current daily streak, and per-day and per-repo breakdowns.',
      inputSchema: { type: 'object', properties: {} },
      execute: () => get('/api/stats'),
    },
    {
      name: 'get_projects',
      description: 'List projects by commit activity over the last 30 days, each with its last-commit age and status.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Only projects with this status' },
          limit: { type: 'number', description: 'Max projects to return' },
        },
      },
      execute: async ({ status, limit } = {}) => {
        let projects = await get('/api/projects');
        if (status) projects = projects.filter(p => p.status === status);
        return { projects: limit ? projects.slice(0, limit) : projects };
      },
    },
    {
      name: 'get_heatmap',
      description: 'Get the daily commit counts behind the contribution heatmap, keyed by YYYY-MM-DD.',
      inputSchema: { type: 'object', properties: {} },
      execute: () => get('/api/heatmap'),
    },
  ];

  (async () => {
    for (const tool of TOOLS) {
      try { await mc.registerTool(tool); }
      catch (err) { console.warn('[webmcp] failed to register', tool.name, err?.message); }
    }
  })();
})();
