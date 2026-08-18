export const CACHE = 's-maxage=300, stale-while-revalidate=600';

export function repoStatus(commits) {
  return commits > 20 ? 'active' : commits > 5 ? 'stable' : 'slow';
}

export async function ghGraphQL(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${globalThis.__ghToken ?? process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      // GitHub rejects requests without a User-Agent. Node's fetch sets one
      // implicitly; the Workers runtime does not.
      'User-Agent': 'cadence',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}
