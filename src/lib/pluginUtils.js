/** Stable key for selection and branch cache (supports forks / same repo name under different owners). */
export function pluginKey(p) {
  return p.full_name || `o9-9/${p.name}`;
}

/** @param {string} href */
export function normalizePluginHtmlUrl(href) {
  return String(href || '')
    .trim()
    .replace(/\/$/, '')
    .toLowerCase();
}
