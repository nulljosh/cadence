const express = require('express');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

const CODE_DIR = path.join(process.env.HOME, 'Documents/Code');
const SKIP = new Set(['_external', 'CLAUDE.md', 'PLAN.md', 'default.profraw']);

function getRepos() {
  return fs.readdirSync(CODE_DIR).filter(name => {
    if (SKIP.has(name)) return false;
    const full = path.join(CODE_DIR, name);
    try { return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, '.git')); }
    catch { return false; }
  });
}

function gitLog(repoPath, since) {
  try {
    return execFileSync('git', ['-C', repoPath, 'log', '--format=%ad', '--date=short', `--since=${since}`], { encoding: 'utf8', timeout: 5000 }).trim().split('\n').filter(Boolean);
  } catch { return []; }
}

function gitLastCommit(repoPath) {
  try {
    return execFileSync('git', ['-C', repoPath, 'log', '-1', '--format=%ar|||%s'], { encoding: 'utf8', timeout: 3000 }).trim();
  } catch { return ''; }
}

function detectPlatform(repoPath) {
  const parts = [];
  if (fs.existsSync(path.join(repoPath, 'ios'))) parts.push('iOS');
  if (fs.existsSync(path.join(repoPath, 'macos'))) parts.push('macOS');
  if (fs.existsSync(path.join(repoPath, 'watchos'))) parts.push('watchOS');
  if (fs.existsSync(path.join(repoPath, 'web')) || fs.existsSync(path.join(repoPath, 'package.json'))) parts.push('web');
  return parts.length ? parts.join(' / ') : 'misc';
}

app.get('/api/projects', (req, res) => {
  const projects = getRepos().map(name => {
    const p = path.join(CODE_DIR, name);
    const last = gitLastCommit(p);
    const [ago, msg] = last.split('|||');
    const commits30 = gitLog(p, '30 days ago').length;
    return { name, platform: detectPlatform(p), lastCommitAgo: ago || 'never', lastCommitMsg: (msg || '').slice(0, 60), commits30, status: commits30 > 20 ? 'active' : commits30 > 5 ? 'stable' : 'slow' };
  }).sort((a, b) => b.commits30 - a.commits30);
  res.json(projects);
});

app.get('/api/heatmap', (req, res) => {
  const counts = {};
  for (const name of getRepos()) {
    for (const d of gitLog(path.join(CODE_DIR, name), '365 days ago')) {
      counts[d] = (counts[d] || 0) + 1;
    }
  }
  res.json(counts);
});

app.get('/api/stats', (req, res) => {
  const repos = getRepos();
  const daily = {}, perRepo = {};
  let total30 = 0;
  for (const name of repos) {
    const dates = gitLog(path.join(CODE_DIR, name), '30 days ago');
    perRepo[name] = dates.length;
    total30 += dates.length;
    for (const d of dates) daily[d] = (daily[d] || 0) + 1;
  }
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (daily[d.toISOString().slice(0, 10)]) streak++; else break;
  }
  res.json({ total30, activeProjects: repos.length, bestDay: Math.max(...Object.values(daily), 0), streak, daily, perRepo });
});

app.listen(3001, () => console.log('Cadence API: http://localhost:3001'));
