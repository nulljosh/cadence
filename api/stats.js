import { ghGraphQL, CACHE } from './_lib.js';

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

  const coll = data.user.contributionsCollection;
  const days = coll.contributionCalendar.weeks.flatMap(w => w.contributionDays);

  const daily = {};
  let total30 = 0;
  for (const d of days) {
    if (d.contributionCount > 0) {
      daily[d.date] = d.contributionCount;
      if (d.date >= cutoff30Str) total30 += d.contributionCount;
    }
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

  const perRepo = {};
  for (const r of coll.commitContributionsByRepository) {
    perRepo[r.repository.name] = r.contributions.totalCount;
  }

  res.setHeader('Cache-Control', CACHE);
  res.json({ total30, activeProjects: coll.commitContributionsByRepository.length, bestDay, streak, daily, perRepo });
}
