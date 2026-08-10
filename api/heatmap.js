import { ghGraphQL, CACHE } from './_lib.js';

const QUERY = `
query($from: DateTime!, $to: DateTime!) {
  user(login: "nulljosh") {
    contributionsCollection(from: $from, to: $to) {
      commitContributionsByRepository(maxRepositories: 100) {
        repository { name }
        contributions(first: 100) {
          nodes { occurredAt commitCount }
        }
      }
    }
  }
}`;

const EXCLUDED = new Set(['journal']);

export default async function handler(req, res) {
  const to = new Date();
  const from = new Date(to);
  from.setFullYear(from.getFullYear() - 1);

  const data = await ghGraphQL(QUERY, {
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const repos = data.user.contributionsCollection.commitContributionsByRepository;
  const counts = {};
  for (const r of repos) {
    if (EXCLUDED.has(r.repository.name)) continue;
    for (const node of r.contributions.nodes) {
      const date = node.occurredAt.slice(0, 10);
      counts[date] = (counts[date] || 0) + node.commitCount;
    }
  }

  res.setHeader('Cache-Control', CACHE);
  res.json(counts);
}
