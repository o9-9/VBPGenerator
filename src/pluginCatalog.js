/**
 * @param {string} url
 * @returns {{ owner: string, repo: string, branch: string | null } | null}
 */
function parseGithubRef(url) {
  const trimmed = url.trim().replace(/\.git$/i, '');
  const m = trimmed.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/?#]+))?/i);
  if (!m) return null;
  const owner = m[1];
  const repo = m[2].replace(/\.git$/i, '');
  const branch = m[3] || null;
  return { owner, repo, branch };
}

/**
 * @param {{ plugin: string, description: string, repository: string }} row
 * @returns {{ displayName: string, name: string, full_name: string, description: string, default_branch: string, html_url: string, clone_url: string } | null}
 */
export function catalogRowToPlugin(row) {
  const ref = parseGithubRef(row.repository);
  if (!ref) return null;
  const { owner, repo, branch } = ref;
  const full_name = `${owner}/${repo}`;
  const default_branch = branch || 'main';
  const html_url = `https://github.com/${full_name}`;
  return {
    displayName: String(row.plugin || '').trim() || repo,
    name: repo,
    full_name,
    description: String(row.description ?? '').trim(),
    default_branch,
    html_url,
    clone_url: `https://github.com/${full_name}.git`,
  };
}

/**
 * @returns {Promise<Array<{ displayName: string, name: string, full_name: string, description: string, default_branch: string, html_url: string, clone_url: string }>>}
 */
export async function fetchPluginsFromCatalog() {
  const base = import.meta.env.BASE_URL || '/';
  const path = base.endsWith('/') ? `${base}plugins.json` : `${base}/plugins.json`;
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load plugins.json: ${response.statusText}`);
  }
  const data = await response.json();
  const rows = Array.isArray(data) ? data : data.plugins;
  if (!Array.isArray(rows)) {
    throw new Error('plugins.json must contain a "plugins" array');
  }
  const plugins = [];
  for (const row of rows) {
    const p = catalogRowToPlugin(row);
    if (p) plugins.push(p);
  }
  return plugins;
}
