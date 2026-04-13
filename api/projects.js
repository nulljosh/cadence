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
}`;

async function ghGraphQL(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return m <= 1 ? 'just now' : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export default async function handler(req, res) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);

  const data = await ghGraphQL(QUERY, {
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const repos = data.user.contributionsCollection.commitContributionsByRepository;

  const projects = repos
    .map(r => {
      const commits30 = r.contributions.totalCount;
      return {
        name: r.repository.name,
        commits30,
        lastCommitAgo: timeAgo(r.repository.pushedAt),
        status: commits30 > 20 ? 'active' : commits30 > 5 ? 'stable' : 'slow',
      };
    })
    .sort((a, b) => b.commits30 - a.commits30);

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.json(projects);
}
