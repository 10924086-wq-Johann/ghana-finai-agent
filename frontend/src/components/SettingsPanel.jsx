import React, { useState, useEffect } from 'react';
import './SettingsPanel.css';

export default function SettingsPanel() {
  const [settings, setSettings] = useState({
    notifications: {
      enabled: true,
      sectors: {
        Banking: true,
        Energy: true,
        Telecom: true,
        Consumer: true,
      },
      frequency: 'immediate', // immediate, hourly, daily
    },
    display: {
      theme: 'dark', // dark, light
      timezone: 'Africa/Accra',
      dateFormat: 'DD/MM/YYYY',
      showConfidenceScore: true,
      showRiskLevel: true,
    },
    scraper: {
      interval: 6, // minutes
      autoRefresh: true,
    },
    language: 'en', // en, tw, ha, ga, ff, ee
    apiKeys: {
      showKeys: false,
      newsapi: '',
      openrouter: '',
      alphavantage: '',
    },
    data: {
      cacheSize: 0, // Will be calculated
      lastBackup: null,
    },
  });

  const [activeTab, setActiveTab] = useState('notifications');
  const [saveMessage, setSaveMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('finai-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }

    // Calculate cache size
    const cache = localStorage.getItem('finai-article-cache');
    if (cache) {
      const sizeInKB = (new Blob([cache]).size / 1024).toFixed(2);
      setSettings((prev) => ({
        ...prev,
        data: { ...prev.data, cacheSize: sizeInKB },
      }));
    }
  }, []);

  // Save settings to localStorage
  const handleSaveSettings = () => {
    localStorage.setItem('finai-settings', JSON.stringify(settings));
    setSaveMessage('✓ Settings saved successfully');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Handle notification toggles
  const handleSectorToggle = (sector) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        sectors: {
          ...prev.notifications.sectors,
          [sector]: !prev.notifications.sectors[sector],
        },
      },
    }));
  };

  // Handle display settings
  const handleDisplayChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      display: { ...prev.display, [field]: value },
    }));
  };

  // Handle scraper settings
  const handleScraperChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      scraper: { ...prev.scraper, [field]: value },
    }));
  };

  // Copy API key to clipboard
  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopyMessage('✓ Copied to clipboard');
    setTimeout(() => setCopyMessage(''), 2000);
  };

  // Clear cache
  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear the article cache? This cannot be undone.')) {
      localStorage.removeItem('finai-article-cache');
      setSettings((prev) => ({
        ...prev,
        data: { ...prev.data, cacheSize: 0 },
      }));
      setSaveMessage('✓ Cache cleared');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Backup data
  const handleBackupData = () => {
    const dataToBackup = {
      settings: JSON.stringify(settings),
      articles: localStorage.getItem('finai-article-cache'),
      timestamp: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(dataToBackup, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataStr));
    element.setAttribute('download', `finai-backup-${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setSettings((prev) => ({
      ...prev,
      data: { ...prev.data, lastBackup: new Date().toLocaleString() },
    }));
    setSaveMessage('✓ Data backed up');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Settings & Preferences</h1>
        <p>Customize your Ghana FinAI experience</p>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
        </button>
        <button
          className={`tab-button ${activeTab === 'display' ? 'active' : ''}`}
          onClick={() => setActiveTab('display')}
        >
          🎨 Display
        </button>
        <button
          className={`tab-button ${activeTab === 'scraper' ? 'active' : ''}`}
          onClick={() => setActiveTab('scraper')}
        >
          🔄 Scraper
        </button>
        <button
          className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          💾 Data & Backup
        </button>
      </div>

      {/* Content */}
      <div className="settings-content">
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Notification Preferences</h2>
              <p>Control how you receive alerts about Ghanaian financial news</p>
            </div>

            <div className="setting-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.notifications.enabled}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, enabled: e.target.checked },
                    }))
                  }
                />
                <span>Enable Notifications</span>
              </label>
              <p className="help-text">
                {settings.notifications.enabled
                  ? '✓ You will receive alerts'
                  : '✗ Notifications are disabled'}
              </p>
            </div>

            <div className="setting-group">
              <label htmlFor="frequency">Alert Frequency:</label>
              <select
                id="frequency"
                value={settings.notifications.frequency}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, frequency: e.target.value },
                  }))
                }
              >
                <option value="immediate">Immediate (as they happen)</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Summary</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Alert me about these sectors:</label>
              <div className="sector-grid">
                {Object.keys(settings.notifications.sectors).map((sector) => (
                  <label key={sector} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.sectors[sector]}
                      onChange={() => handleSectorToggle(sector)}
                    />
                    <span>{sector}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Display Tab */}
        {activeTab === 'display' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Display Settings</h2>
              <p>Customize how information is shown to you</p>
            </div>

            <div className="setting-group">
              <label htmlFor="theme">Theme:</label>
              <select
                id="theme"
                value={settings.display.theme}
                onChange={(e) => handleDisplayChange('theme', e.target.value)}
              >
                <option value="dark">🌙 Dark (Default)</option>
                <option value="light">☀️ Light</option>
              </select>
              <p className="help-text">Changes take effect on next page refresh</p>
            </div>

            <div className="setting-group">
              <label htmlFor="timezone">Timezone:</label>
              <select
                id="timezone"
                value={settings.display.timezone}
                onChange={(e) => handleDisplayChange('timezone', e.target.value)}
              >
                <option value="Africa/Accra">Africa/Accra (GMT)</option>
                <option value="UTC">UTC</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>

            <div className="setting-group">
              <label htmlFor="dateFormat">Date Format:</label>
              <select
                id="dateFormat"
                value={settings.display.dateFormat}
                onChange={(e) => handleDisplayChange('dateFormat', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.display.showConfidenceScore}
                  onChange={(e) => handleDisplayChange('showConfidenceScore', e.target.checked)}
                />
                <span>Show Confidence Scores on recommendations</span>
              </label>
            </div>

            <div className="setting-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.display.showRiskLevel}
                  onChange={(e) => handleDisplayChange('showRiskLevel', e.target.checked)}
                />
                <span>Show Risk Level on recommendations</span>
              </label>
            </div>
          </div>
        )}

        {/* Scraper Tab */}
        {activeTab === 'scraper' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Scraper Settings</h2>
              <p>Control how often the app fetches financial news</p>
            </div>

            <div className="setting-group">
              <label htmlFor="interval">Scraper Interval:</label>
              <div className="input-with-unit">
                <input
                  id="interval"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.scraper.interval}
                  onChange={(e) =>
                    handleScraperChange('interval', parseInt(e.target.value))
                  }
                />
                <span>minutes</span>
              </div>
              <p className="help-text">
                How often to check for new articles (1-60 minutes). More frequent = more data but
                higher API usage.
              </p>
            </div>

            <div className="setting-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.scraper.autoRefresh}
                  onChange={(e) => handleScraperChange('autoRefresh', e.target.checked)}
                />
                <span>Auto-refresh on app load</span>
              </label>
              <p className="help-text">
                {settings.scraper.autoRefresh
                  ? 'The app will check for new articles when you open it'
                  : 'The app will use cached articles'}
              </p>
            </div>

            <div className="setting-group info-box">
              <h3>📊 Current Status</h3>
              <p>Scraper Interval: Every {settings.scraper.interval} minutes</p>
              <p>
                Auto Refresh:{' '}
                {settings.scraper.autoRefresh ? '✓ Enabled' : '✗ Disabled'}
              </p>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Data & Backup</h2>
              <p>Manage your data and create backups</p>
            </div>

            <div className="setting-group info-box">
              <h3>💾 Storage Information</h3>
              <p>Cache Size: <strong>{settings.data.cacheSize} KB</strong></p>
              <p>
                Last Backup:{' '}
                <strong>{settings.data.lastBackup || 'Never backed up'}</strong>
              </p>
            </div>

            <div className="setting-group">
              <button className="action-button primary" onClick={handleBackupData}>
                📥 Backup All Data
              </button>
              <p className="help-text">Downloads your settings and article cache as a JSON file</p>
            </div>

            <div className="setting-group">
              <button className="action-button danger" onClick={handleClearCache}>
                🗑️ Clear Cache
              </button>
              <p className="help-text">
                This will delete all cached articles. You can always re-download them.
              </p>
            </div>

            <div className="setting-group info-box warning">
              <h3>⚠️ About Your Data</h3>
              <ul>
                <li>All settings are stored locally in your browser</li>
                <li>No data is sent to external servers</li>
                <li>Clearing your browser data will reset all preferences</li>
                <li>Use the Backup function to save your preferences</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="settings-footer">
        <button className="save-button" onClick={handleSaveSettings}>
          💾 Save All Settings
        </button>
        {saveMessage && <span className="save-message">{saveMessage}</span>}
        {copyMessage && <span className="copy-message">{copyMessage}</span>}
      </div>
    </div>
  );
}
