const QUERY = `
query($from: DateTime!, $to: DateTime!) {
  user(login: "nulljosh") {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays { date contributionCount }
        }
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

export default async function handler(req, res) {
  const to = new Date();
  const from = new Date(to);
  from.setFullYear(from.getFullYear() - 1);

  const data = await ghGraphQL(QUERY, {
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const days = data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap(w => w.contributionDays);

  const counts = {};
  for (const d of days) {
    if (d.contributionCount > 0) counts[d.date] = d.contributionCount;
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.json(counts);
}
