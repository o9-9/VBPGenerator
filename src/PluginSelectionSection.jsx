import { Loader2 } from 'lucide-react';
import { pluginKey } from './pluginUtils';

function safeDomId(key) {
  return key.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function PluginSelectionSection({
  plugins,
  loading,
  selectedPlugins,
  pluginBranches,
  onToggle,
  onBranchChange,
  onLoadBranches,
  loadingBranches,
}) {
  const selectedCount = selectedPlugins.size;

  return (
    <div className="glass-card delay-2 plugin-selection-card">
      <div className="plugin-selection-header">
        <h3 className="form-group-title plugin-selection-title">Plugins</h3>
        <button
          type="button"
          className="btn btn-secondary plugin-selection-load-branches"
          onClick={onLoadBranches}
          disabled={loadingBranches || loading || selectedCount === 0}
        >
          {loadingBranches ? <Loader2 className="spin" size={14} aria-hidden /> : null}
          {loadingBranches ? 'Loading…' : 'Load branches for selected'}
        </button>
      </div>
      <p className="plugin-selection-hint">
        {selectedCount} 🛒
      </p>

      {loading ? (
        <div className="plugin-selection-loading">Loading plugins catalog…</div>
      ) : (
        <div className="plugin-select-grid" role="group" aria-label="Plugin selection">
          {plugins.map((plugin) => {
            const key = pluginKey(plugin);
            const isSelected = selectedPlugins.has(key);
            const branches = pluginBranches[key];
            const currentBranch = selectedPlugins.get(key) || plugin.default_branch;
            const label = plugin.displayName || plugin.name;
            const desc =
              plugin.description && plugin.description.trim()
                ? plugin.description.trim()
                : 'No description';
            const tipId = `plugin-tip-${safeDomId(key)}`;
            const inputId = `plugin-cb-${safeDomId(key)}`;

            return (
              <div
                key={key}
                className={`plugin-select-cell ${isSelected ? 'plugin-select-cell--selected' : ''}`}
              >
                <div className="plugin-select-row">
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(key, plugin.default_branch)}
                    aria-describedby={tipId}
                  />
                  <label htmlFor={inputId} className="plugin-select-name-label">
                    <span className="plugin-select-name">{label}</span>
                  </label>
                </div>
                <div id={tipId} role="tooltip" className="plugin-select-tooltip">
                  {desc}
                </div>
                {isSelected ? (
                  <div className="plugin-select-branch-wrap">
                    {branches && branches.length > 0 ? (
                      <select
                        className="plugin-select-branch"
                        value={currentBranch}
                        onChange={(e) => onBranchChange(key, e.target.value)}
                        aria-label={`Branch for ${label}`}
                      >
                        {branches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="plugin-select-branch-default">
                        Branch: {plugin.default_branch}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
