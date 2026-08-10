import { ghGraphQL, CACHE } from './_lib.js';

const QUERY = `
query($from: DateTime!, $to: DateTime!) {
  user(login: "nulljosh") {
    contributionsCollection(from: $from, to: $to) {
      commitContributionsByRepository(maxRepositories: 100) {
        repository { name }
        contributions(first: 100) {
          totalCount
          nodes { occurredAt commitCount }
        }
      }
    }
  }
}`;

const EXCLUDED = new Set(['journal']);

export default async function handler(req, res) {
  const to = new Date();
  const from365 = new Date(to);
  from365.setFullYear(from365.getFullYear() - 1);
  const cutoff30 = new Date(to);
  cutoff30.setDate(cutoff30.getDate() - 30);
  const cutoff30Str = cutoff30.toISOString().slice(0, 10);

  const data = await ghGraphQL(QUERY, {
    from: from365.toISOString(),
    to: to.toISOString(),
  });

  const repos = data.user.contributionsCollection.commitContributionsByRepository;

  const daily = {};
  const perRepo = {};
  for (const r of repos) {
    if (EXCLUDED.has(r.repository.name)) continue;
    perRepo[r.repository.name] = r.contributions.totalCount;
    for (const node of r.contributions.nodes) {
      const date = node.occurredAt.slice(0, 10);
      daily[date] = (daily[date] || 0) + node.commitCount;
    }
  }

  let total30 = 0;
  for (const [date, count] of Object.entries(daily)) {
    if (date >= cutoff30Str) total30 += count;
  }

  const bestDay = Object.values(daily).reduce((a, b) => Math.max(a, b), 0);

  let streak = 0;
  const toStr = to.toISOString().slice(0, 10);
  for (let i = 0; i < 365; i++) {
    const ms = new Date(toStr).getTime() - i * 86400000;
    const key = new Date(ms).toISOString().slice(0, 10);
    if (daily[key]) streak++;
    else break;
  }

  res.setHeader('Cache-Control', CACHE);
  res.json({ total30, activeProjects: Object.keys(perRepo).length, bestDay, streak, daily, perRepo });
}
