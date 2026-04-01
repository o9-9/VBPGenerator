/**
 * Regenerates public/plugins.json from public/plugins.md (table with **\[Name](https://github.com/...)** links).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mdPath = path.join(root, 'public', 'plugins.md');
const outPath = path.join(root, 'public', 'plugins.json');

const LINK_RE = /\*\*\[([^\]]+)\]\((https:\/\/github\.com[^)\s]+)\)\*\*/i;

function parseGithubRef(url) {
  const trimmed = url.trim().replace(/\.git$/i, '');
  const m = trimmed.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/?#]+))?/i);
  if (!m) return null;
  const owner = m[1];
  const repo = m[2].replace(/\.git$/i, '');
  const branch = m[3] || null;
  return { owner, repo, branch };
}

const md = fs.readFileSync(mdPath, 'utf8');
const plugins = [];

for (const line of md.split(/\r?\n/)) {
  const t = line.trim();
  if (t.startsWith('| Plugin |') && t.includes('Description')) continue;
  if (t.startsWith('|') && t.includes('---')) continue;
  if (!t.startsWith('|')) continue;
  const linkMatch = line.match(LINK_RE);
  if (!linkMatch) continue;
  const plugin = linkMatch[1].replace(/\s+/g, ' ').trim();
  const repository = linkMatch[2].trim();
  if (!parseGithubRef(repository)) continue;
  const parts = line.split('|').map((s) => s.trim());
  const descCol = parts[2] ?? '';
  const descTrim = descCol.trim();
  const description = descTrim === '' || descTrim === '---' ? '' : descCol;
  plugins.push({ plugin, description, repository });
}

fs.writeFileSync(outPath, JSON.stringify({ plugins }, null, 2), 'utf8');
console.log(`Wrote ${plugins.length} entries to public/plugins.json`);
