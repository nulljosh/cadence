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
    }
  }
}`;

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

  res.setHeader('Cache-Control', CACHE);
  res.json(counts);
}
