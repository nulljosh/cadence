import { ghGraphQL, CACHE, repoStatus } from './_lib.js';

const QUERY = `
query($from: DateTime!, $to: DateTime!) {
  user(login: "nulljosh") {
    contributionsCollection(from: $from, to: $to) {
      commitContributionsByRepository(maxRepositories: 100) {
        repository { name pushedAt }
        contributions { totalCount }
      }
    }
  }
  journalRepo: repository(owner: "nulljosh", name: "journal") {
    pushedAt
    defaultBranchRef {
      target {
        ... on Commit { history(since: $from) { totalCount } }
      }
    }
  }
}`;

const EXCLUDED = new Set(['journal']);

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return m <= 1 ? 'just now' : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default async function handler(req, res) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);

  const data = await ghGraphQL(QUERY, {
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const repos = data.user.contributionsCollection.commitContributionsByRepository
    .filter(r => !EXCLUDED.has(r.repository.name));

  const projects = repos
    .map(r => {
      const commits30 = r.contributions.totalCount;
      return {
        name: r.repository.name,
        commits30,
        lastCommitAgo: timeAgo(r.repository.pushedAt),
        status: repoStatus(commits30),
      };
    })
    .sort((a, b) => b.commits30 - a.commits30);

  const jr = data.journalRepo;
  const commitCount = jr?.defaultBranchRef?.target?.history?.totalCount ?? 0;
  projects.push({
    name: 'journal',
    commits30: commitCount,
    lastCommitAgo: timeAgo(jr?.pushedAt || new Date().toISOString()),
    status: repoStatus(commitCount),
  });

  res.setHeader('Cache-Control', CACHE);
  res.json(projects);
}
