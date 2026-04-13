const QUERY = `
query($from: DateTime!, $to: DateTime!) {
  user(login: "nulljosh") {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays { date contributionCount }
        }
      }
      commitContributionsByRepository(maxRepositories: 100) {
        repository { name }
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

export default async function handler(req, res) {
  const to = new Date();
  const from30 = new Date(to);
  from30.setDate(from30.getDate() - 30);

  const data = await ghGraphQL(QUERY, {
    from: from30.toISOString(),
    to: to.toISOString(),
  });

  const coll = data.user.contributionsCollection;
  const days = coll.contributionCalendar.weeks.flatMap(w => w.contributionDays);

  const daily = {};
  let total30 = 0;
  for (const d of days) {
    if (d.contributionCount > 0) {
      daily[d.date] = d.contributionCount;
      total30 += d.contributionCount;
    }
  }

  const bestDay = Math.max(...Object.values(daily), 0);

  // Streak: count consecutive days backward from today
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(to);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (daily[key]) streak++;
    else break;
  }

  const activeProjects = coll.commitContributionsByRepository.length;

  const perRepo = {};
  for (const r of coll.commitContributionsByRepository) {
    perRepo[r.repository.name] = r.contributions.totalCount;
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.json({ total30, activeProjects, bestDay, streak, daily, perRepo });
}
