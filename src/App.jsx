import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchBranchesForPlugins, fetchRepoByUrl } from './PluginFetcher';
import { fetchPluginsFromCatalog } from './pluginCatalog';
import { pluginKey, normalizePluginHtmlUrl } from './pluginUtils';
import { PluginSelectionSection } from './PluginSelectionSection';
import { generateScript } from './ScriptGenerator';
import { Terminal, Download, Code, Settings, Loader2, Check, Plus, Trash2 } from 'lucide-react';
import './index.css';

const DEFAULT_SELECTED_PLUGIN_URLS = new Set([
  'https://github.com/o9-9/vb-voicechanneladmin',
  'https://github.com/o9-9/vb-voicechannelfollowuser',
  'https://github.com/o9-9/vb-voicechannellog',
  'https://github.com/o9-9/vb-voicechannelutils',
  'https://github.com/o9-9/vb-voicechannelwaitforslot',
]);

function App() {
  const [mdPlugins, setMdPlugins] = useState([]);
  const [loadingPlugins, setLoadingPlugins] = useState(true);

  // Extra repos by URL (code block rows); resolved via GitHub API
  const [pluginUrlRows, setPluginUrlRows] = useState([]);
  const [urlResolvedPlugins, setUrlResolvedPlugins] = useState([]);
  const [loadingUrlPlugins, setLoadingUrlPlugins] = useState(false);

  const plugins = useMemo(() => {
    const byKey = new Map();
    for (const p of mdPlugins) {
      byKey.set(pluginKey(p), p);
    }
    for (const p of urlResolvedPlugins) {
      byKey.set(pluginKey(p), p);
    }
    const seen = new Set();
    const ordered = [];
    for (const p of mdPlugins) {
      const k = pluginKey(p);
      if (seen.has(k)) continue;
      seen.add(k);
      ordered.push(byKey.get(k));
    }
    for (const p of urlResolvedPlugins) {
      const k = pluginKey(p);
      if (seen.has(k)) continue;
      seen.add(k);
      ordered.push(byKey.get(k));
    }
    return ordered;
  }, [mdPlugins, urlResolvedPlugins]);

  // Form State
  const [client, setClient] = useState('Equicord');
  const [forkUrl, setForkUrl] = useState('');
  const [shell, setShell] = useState('powershell7');

  // Plugin Selection: Map<pluginKey, BranchName>
  const [selectedPlugins, setSelectedPlugins] = useState(new Map());

  // Branch Management
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [pluginBranches, setPluginBranches] = useState({}); // { [pluginKey]: ['main', 'dev', ...] }

  // More settings
  const [useGit, setUseGit] = useState(true);
  const [dependencyInstaller, setDependencyInstaller] = useState('winget');
  const [installPath, setInstallPath] = useState('');
  const [discordBranch, setDiscordBranch] = useState('auto');
  const [installOpenAsar, setInstallOpenAsar] = useState(true);

  // UI State
  const [scriptOpen, setScriptOpen] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const defaultsSeededRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchPluginsFromCatalog()
      .then((data) => {
        if (!cancelled) {
          setMdPlugins(data);
          setLoadingPlugins(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setMdPlugins([]);
          setLoadingPlugins(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadingPlugins || plugins.length === 0 || defaultsSeededRef.current) return;
    defaultsSeededRef.current = true;
    const next = new Map();
    for (const p of plugins) {
      const u = normalizePluginHtmlUrl(p.html_url);
      if (DEFAULT_SELECTED_PLUGIN_URLS.has(u)) {
        next.set(pluginKey(p), p.default_branch);
      }
    }
    setSelectedPlugins(next);
  }, [loadingPlugins, plugins]);

  useEffect(() => {
    const urls = pluginUrlRows.map(r => r.url.trim()).filter(Boolean);
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (urls.length === 0) {
        setUrlResolvedPlugins([]);
        setLoadingUrlPlugins(false);
        return;
      }
      setLoadingUrlPlugins(true);
      const results = await Promise.all(urls.map(u => fetchRepoByUrl(u)));
      if (cancelled) return;
      setUrlResolvedPlugins(results.filter(Boolean));
      setLoadingUrlPlugins(false);
    })();
    return () => { cancelled = true; };
  }, [pluginUrlRows]);

  const addPluginUrlRow = () => {
    setPluginUrlRows(prev => [...prev, { id: crypto.randomUUID(), url: '' }]);
  };

  const removePluginUrlRow = (id) => {
    setPluginUrlRows(prev => prev.filter(r => r.id !== id));
  };

  const updatePluginUrlRow = (id, url) => {
    setPluginUrlRows(prev => prev.map(r => (r.id === id ? { ...r, url } : r)));
  };

  const togglePlugin = (key, defaultBranch) => {
    const newSelection = new Map(selectedPlugins);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      const branches = pluginBranches[key];
      const branchToUse = (branches && branches.length > 0) ? branches[0] : defaultBranch;
      newSelection.set(key, branchToUse);
    }
    setSelectedPlugins(newSelection);
  };

  const changeBranch = (key, branch) => {
    const newSelection = new Map(selectedPlugins);
    if (newSelection.has(key)) {
      newSelection.set(key, branch);
      setSelectedPlugins(newSelection);
    }
  };

  const loadBranchesForSelected = async () => {
    const selectedList = plugins.filter((p) => selectedPlugins.has(pluginKey(p)));
    if (selectedList.length === 0) return;
    setLoadingBranches(true);
    try {
      const batch = await fetchBranchesForPlugins(selectedList, 4);
      setPluginBranches((prev) => ({ ...prev, ...batch }));
      setSelectedPlugins((prev) => {
        const next = new Map(prev);
        for (const [k, br] of next) {
          const list = batch[k];
          if (list && list.length > 0 && !list.includes(br)) {
            next.set(k, list[0]);
          }
        }
        return next;
      });
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleGenerate = (download = false) => {
    // Build the selected plugin list with the branch each one should use
    const selectedPluginObjects = [];
    selectedPlugins.forEach((branch, key) => {
      const original = plugins.find(p => pluginKey(p) === key);
      if (original) {
        selectedPluginObjects.push({
          ...original,
          branch
        });
      }
    });

    const config = {
      client,
      forkUrl,
      shell,
      useGit,
      dependencyInstaller,
      installPath,
      discordBranch,
      installOpenAsar
    };

    const script = generateScript(config, selectedPluginObjects);
    setGeneratedScript(script);

    if (download) {
      const blob = new Blob([script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `install_client.${shell === 'cmd' ? 'bat' : 'ps1'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      setScriptOpen(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="App">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-brand">
            <Terminal size={24} color="var(--primary-color)" />
            <span>o9</span>
          </div>
        </div>
      </nav>

      <div className="container animate-fade-in">
        {/* Header */}
        <header className="header">
          <h1>Generator</h1>
          <p>Equicord/Vencord Plugin Generate a custom installation script with your favorite plugins pre-loaded.</p>
        </header>

        {/* Client Selection */}
        <div className="glass-card delay-1">
          <h3 className="form-group-title">Choose</h3>
          <div className="radio-group">
            <label className={`radio-option ${client === 'Equicord' ? 'selected' : ''}`}>
              <input type="radio" name="client" value="Equicord" checked={client === 'Equicord'} onChange={(e) => setClient(e.target.value)} />
              <span>Equicord</span>
            </label>
            <label className={`radio-option ${client === 'Vencord' ? 'selected' : ''}`}>
              <input type="radio" name="client" value="Vencord" checked={client === 'Vencord'} onChange={(e) => setClient(e.target.value)} />
              <span>Vencord</span>
            </label>
            <label className={`radio-option ${client === 'Fork' ? 'selected' : ''}`}>
              <input type="radio" name="client" value="Fork" checked={client === 'Fork'} onChange={(e) => setClient(e.target.value)} />
              <span>Fork</span>
            </label>
          </div>
          {client === 'Fork' && (
            <input
              type="text"
              placeholder="https://github.com/o9-9/Equicord"
              value={forkUrl}
              onChange={(e) => setForkUrl(e.target.value)}
              className="animate-fade-in"
            />
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '0.8rem' }}>Branch</h4>
            <div className="radio-group" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))' }}>
              {['auto', 'stable', 'ptb', 'canary'].map(branch => (
                <label key={branch} className={`radio-option ${discordBranch === branch ? 'selected' : ''}`} style={{ padding: '0.5rem' }}>
                  <input type="radio" name="discordBranch" value={branch} checked={discordBranch === branch} onChange={(e) => setDiscordBranch(e.target.value)} />
                  <span style={{ fontSize: '0.8rem' }}>{branch.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Plugin URLs (code block) → plugin list */}
        <div className="glass-card delay-2">
          <h3 className="form-group-title">Add</h3>
          <p className="plugin-urls-hint">
            Add GitHub Repository URLs (HTTPS or SSH). They are merged with the catalog. Empty rows are ignored.
          </p>
          <div className="plugin-urls-block">
            {pluginUrlRows.length === 0 ? (
              <p style={{ margin: '0.25rem 0', color: '#888', fontFamily: 'var(--font-family)', fontSize: '0.8rem' }}>
                No extra URLs yet — use &quot;Add URL&quot; below.
              </p>
            ) : (
              pluginUrlRows.map(row => (
                <div key={row.id} className="plugin-url-row">
                  <input
                    type="text"
                    placeholder="https://github.com/owner/fork"
                    value={row.url}
                    onChange={(e) => updatePluginUrlRow(row.id, e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary plugin-url-remove"
                    onClick={() => removePluginUrlRow(row.id)}
                    title="Remove URL"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
            <button type="button" className="btn btn-secondary" onClick={addPluginUrlRow} style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
              <Plus size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
              Add URL
            </button>
          </div>
          {loadingUrlPlugins && pluginUrlRows.some(r => r.url.trim()) ? (
            <div style={{ marginTop: '0.75rem', color: '#888', fontSize: '0.85rem' }}>
              <Loader2 className="spin" size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
              Resolving repository URLs…
            </div>
          ) : null}
        </div>

        <PluginSelectionSection
          plugins={plugins}
          loading={loadingPlugins}
          selectedPlugins={selectedPlugins}
          pluginBranches={pluginBranches}
          onToggle={togglePlugin}
          onBranchChange={changeBranch}
          onLoadBranches={loadBranchesForSelected}
          loadingBranches={loadingBranches}
        />

        {/* Shell Selection */}
        <div className="glass-card delay-3">
          <h3 className="form-group-title">Shell</h3>
          <div className="radio-group">
            <label className={`radio-option ${shell === 'powershell7' ? 'selected' : ''}`}>
              <input type="radio" name="shell" value="powershell7" checked={shell === 'powershell7'} onChange={(e) => setShell(e.target.value)} />
              <span>Powershell 7+ (Recommended)</span>
            </label>
            <label className={`radio-option ${shell === 'powershell5' ? 'selected' : ''}`}>
              <input type="radio" name="shell" value="powershell5" checked={shell === 'powershell5'} onChange={(e) => setShell(e.target.value)} />
              <span>Powershell 5</span>
            </label>
            <label className={`radio-option ${shell === 'cmd' ? 'selected' : ''}`}>
              <input type="radio" name="shell" value="cmd" checked={shell === 'cmd'} onChange={(e) => setShell(e.target.value)} />
              <span>CMD / Batch</span>
            </label>
            <label className={`radio-option disabled`} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              <input type="radio" name="shell" value="bash" disabled />
              <span>Bash (coming soon)</span>
            </label>
          </div>
        </div>

        {/* More settings */}
        <div className="glass-card delay-4">
          <h3 className="form-group-title">
            <Settings size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            5. More settings
          </h3>

          <div className="form-group">
            <label className={`checkbox-option ${useGit ? 'selected' : ''}`}>
              <input type="checkbox" checked={useGit} onChange={(e) => setUseGit(e.target.checked)} />
              <span>Use Git (for updates later)</span>
            </label>
          </div>

          <div className="form-group">
            <label className={`checkbox-option ${installOpenAsar ? 'selected' : ''}`}>
              <input type="checkbox" checked={installOpenAsar} onChange={(e) => setInstallOpenAsar(e.target.checked)} />
              <span>Install OpenAsar</span>
            </label>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Dependency Installer</label>
            <select
              value={dependencyInstaller}
              onChange={(e) => setDependencyInstaller(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: '#fff'
              }}
            >
              <option value="">None (Already installed)</option>
              <option value="winget">Winget</option>
              <option value="scoop">Scoop</option>
              <option value="chocolatey">Chocolatey</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Install Location (leave blank for current folder)</label>
            <input
              type="text"
              placeholder="C:\DiscordClients"
              value={installPath}
              onChange={(e) => setInstallPath(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="btn-group delay-4" style={{ justifyContent: 'center', marginBottom: '4rem' }}>
          <button className="btn" onClick={() => handleGenerate(true)}>
            <Download size={20} />
            Download
          </button>
          <button className="btn btn-secondary" onClick={() => handleGenerate(false)}>
            <Code size={20} />
            Preview
          </button>
        </div>

      </div>

      {/* Script Modal */}
      <div className={`modal-overlay ${scriptOpen ? 'open' : ''}`} onClick={() => setScriptOpen(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Script</h3>
            <button className="close-btn" onClick={() => setScriptOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <pre className="code-block">{generatedScript}</pre>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={copyToClipboard}>
              {copyFeedback ? <Check size={18} /> : null}
              {copyFeedback ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button className="btn" onClick={() => setScriptOpen(false)}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
