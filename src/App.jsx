import { useState, useEffect } from 'react';
import { fetchPlugins, fetchBranches } from './PluginFetcher';
import { generateScript } from './ScriptGenerator';
import { Terminal, Download, Code, Settings, Loader2, Check } from 'lucide-react';
import './index.css';

function App() {
  const [plugins, setPlugins] = useState([]);
  const [loadingPlugins, setLoadingPlugins] = useState(true);

  // Form State
  const [client, setClient] = useState('Equicord');
  const [forkUrl, setForkUrl] = useState('');
  const [shell, setShell] = useState('powershell7');

  // Plugin Selection: Map<PluginName, BranchName>
  const [selectedPlugins, setSelectedPlugins] = useState(new Map());

  // Branch Management
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [pluginBranches, setPluginBranches] = useState({}); // { pluginName: ['main', 'dev', ...] }

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

  useEffect(() => {
    fetchPlugins().then(data => {
      setPlugins(data);
      setLoadingPlugins(false);
    });
  }, []);

  const togglePlugin = (pluginName, defaultBranch) => {
    const newSelection = new Map(selectedPlugins);
    if (newSelection.has(pluginName)) {
      newSelection.delete(pluginName);
    } else {
      // If branches are already loaded, use the first one
      // Otherwise, fall back to the repo's default branch
      const branches = pluginBranches[pluginName];
      const branchToUse = (branches && branches.length > 0) ? branches[0] : defaultBranch;
      newSelection.set(pluginName, branchToUse);
    }
    setSelectedPlugins(newSelection);
  };

  const changeBranch = (pluginName, branch) => {
    const newSelection = new Map(selectedPlugins);
    if (newSelection.has(pluginName)) {
      newSelection.set(pluginName, branch);
      setSelectedPlugins(newSelection);
    }
  };

  const loadAllBranches = async () => {
    setLoadingBranches(true);
    const newBranches = { ...pluginBranches };

    // Fetch branches in parallel so the user does not have to wait too long
    const promises = plugins.map(async (plugin) => {
      if (newBranches[plugin.name]) return; // already loaded
      const branches = await fetchBranches(plugin.name);
      if (branches.length > 0) {
        newBranches[plugin.name] = branches;
      }
    });

    await Promise.all(promises);
    setPluginBranches(newBranches);
    setLoadingBranches(false);
  };

  const handleGenerate = (download = false) => {
    // Build the selected plugin list with the branch each one should use
    const selectedPluginObjects = [];
    selectedPlugins.forEach((branch, name) => {
      const original = plugins.find(p => p.name === name);
      if (original) {
        selectedPluginObjects.push({
          ...original,
          branch: branch // Override or add branch property
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
            <span>Generator</span>
          </div>
        </div>
      </nav>

      <div className="container animate-fade-in">
        {/* Header */}
        <header className="header">
          <h1>Setup</h1>
          <p>Installer with Plugins.</p>
        </header>

        {/* Client Selection */}
        <div className="glass-card delay-1">
          <h3 className="form-group-title">1. Choose Client:</h3>
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
            <h4 style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '0.8rem' }}>Discord Branch</h4>
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

        {/* Plugin Selection */}
        <div className="glass-card delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3 className="form-group-title" style={{ margin: 0 }}>2. Choose Plugins:</h3>
            <button
              className="btn btn-secondary"
              onClick={loadAllBranches}
              disabled={loadingBranches}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              {loadingBranches ? <Loader2 className="spin" size={14} /> : null}
              {loadingBranches ? 'Loading...' : 'Load Branches'}
            </button>
          </div>

          {loadingPlugins ? (
            <div style={{ color: '#888', fontStyle: 'italic' }}>Loading plugins from GitHub...</div>
          ) : (
            <div className="checkbox-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {plugins.map(plugin => {
                const isSelected = selectedPlugins.has(plugin.name);
                const branches = pluginBranches[plugin.name];
                const currentBranch = selectedPlugins.get(plugin.name) || plugin.default_branch;

                return (
                  <div key={plugin.name} className={`checkbox-option ${isSelected ? 'selected' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <label style={{ display: 'flex', alignItems: 'center', width: '100%', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePlugin(plugin.name, plugin.default_branch)}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.8rem' }}>
                        <span style={{ fontWeight: 600 }}>{plugin.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#bbb' }}>{plugin.description || "No description"}</span>
                      </div>
                    </label>

                    {/* Branch selection shows up once branches are loaded */}
                    {branches && (
                      <div style={{ marginLeft: '2rem', marginTop: '0.5rem', width: 'calc(100% - 2rem)' }}>
                        <select
                          value={currentBranch}
                          onChange={(e) => changeBranch(plugin.name, e.target.value)}
                          disabled={!isSelected}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '0.3rem',
                            borderRadius: '4px',
                            background: 'rgba(0,0,0,0.3)',
                            color: isSelected ? '#fff' : '#777',
                            border: '1px solid var(--glass-border)',
                            fontSize: '0.8rem',
                            width: 'auto'
                          }}
                        >
                          {branches.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {!branches && (
                      <div style={{ marginLeft: '2rem', marginTop: '0.2rem', fontSize: '0.7rem', color: '#666' }}>
                        Default Branch: {plugin.default_branch}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shell Selection */}
        <div className="glass-card delay-3">
          <h3 className="form-group-title">3. Choose a shell:</h3>
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
            More settings
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
