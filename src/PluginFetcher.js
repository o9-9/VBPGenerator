import { pluginKey } from './pluginUtils';

/** @returns {{ owner: string, repo: string } | null} */
export function parseGitHubRepoUrl(url) {
  const s = String(url).trim();
  if (!s) return null;
  const m = s.match(/github\.com[/:]([^/]+)\/([^/.?#]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/i, '') };
}

/** Resolves a GitHub HTTPS/SSH URL to the same plugin shape as the JSON catalog. */
export async function fetchRepoByUrl(url) {
  const parsed = parseGitHubRepoUrl(url);
  if (!parsed) return null;
  const fullName = `${parsed.owner}/${parsed.repo}`;
  try {
    const response = await fetch(`https://api.github.com/repos/${fullName}`);
    if (!response.ok) {
      console.warn(`Failed to resolve repo ${fullName}: ${response.statusText}`);
      return null;
    }
    const repo = await response.json();
    return {
      displayName: repo.name,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description ?? '',
      default_branch: repo.default_branch,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
    };
  } catch (error) {
    console.error(`Error resolving ${url}:`, error);
    return null;
  }
}

/**
 * Fetch branches for many repos with limited concurrency (anonymous API rate limits).
 * @param {Array<{ full_name?: string, name: string }>} plugins
 * @param {number} [concurrency=4]
 * @returns {Promise<Record<string, string[]>>} map full_name key -> branch names
 */
export async function fetchBranchesForPlugins(plugins, concurrency = 4) {
  const out = {};
  if (plugins.length === 0) return out;

  let next = 0;
  async function worker() {
    while (next < plugins.length) {
      const i = next++;
      const plugin = plugins[i];
      const fullName = plugin.full_name || `o9-9/${plugin.name}`;
      const key = pluginKey(plugin);
      const branches = await fetchBranches(fullName);
      if (branches.length > 0) {
        out[key] = branches;
      }
    }
  }

  const n = Math.min(Math.max(1, concurrency), plugins.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

/** @param {string} fullName owner/repo */
export async function fetchBranches(fullName) {
    try {
        const response = await fetch(`https://api.github.com/repos/${fullName}/branches`);
        if (!response.ok) {
            console.warn(`Failed to fetch branches for ${fullName}: ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        return data.map(b => b.name);
    } catch (error) {
        console.error(`Error fetching branches for ${fullName}:`, error);
        return [];
    }
}
