import { useEffect, useState } from 'react';
import type { SystemSettings } from '../../types';
import { getSettings, saveSettings } from '../../services/settingsService';
import './Settings.css';

type SettingsTab = 'general' | 'display' | 'alerts' | 'about';

export function Settings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
  }, []);

  function handleSave() {
    if (!settings) return;
    saveSettings(settings).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }).catch(console.error);
  }

  function updateDisplay<K extends keyof SystemSettings['display']>(key: K, value: SystemSettings['display'][K]) {
    setSettings((prev) => prev ? { ...prev, display: { ...prev.display, [key]: value } } : prev);
  }

  function updateAlerts<K extends keyof SystemSettings['alerts']>(key: K, value: SystemSettings['alerts'][K]) {
    setSettings((prev) => prev ? { ...prev, alerts: { ...prev.alerts, [key]: value } } : prev);
  }

  if (!settings) return null;

  return (
    <div className="settings">
      <header className="view-header">
        <div>
          <h1 className="view-title">Settings</h1>
          <p className="view-subtitle">Application configuration and preferences</p>
        </div>
        <div className="settings__header-actions">
          <button className="btn-secondary">Reset to Defaults</button>
          <button className={`btn-primary${saved ? ' btn-primary--saved' : ''}`} onClick={handleSave}>
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="settings__tabs" aria-label="Settings sections">
        {(['general', 'display', 'alerts', 'about'] as SettingsTab[]).map((tab) => (
          <button
            key={tab}
            className={`settings__tab${activeTab === tab ? ' settings__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
            aria-selected={activeTab === tab}
            role="tab"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* General */}
      {activeTab === 'general' && (
        <section className="settings__panel" aria-label="General settings">
          <h2 className="settings__section-title">General</h2>

          <div className="settings__field-group">
            <div className="settings__field">
              <label htmlFor="instance-name">Instance Name</label>
              <input
                id="instance-name"
                type="text"
                value={settings.instanceName}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, instanceName: e.target.value } : prev)}
              />
              <p className="settings__field-hint">Identifies this ROTV in multi-vehicle deployments.</p>
            </div>

            <div className="settings__field">
              <label htmlFor="operator-name">Operator Name</label>
              <input
                id="operator-name"
                type="text"
                value={settings.operatorName}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, operatorName: e.target.value } : prev)}
              />
              <p className="settings__field-hint">Logged against all events, calibrations, and pre-flight checks.</p>
            </div>
          </div>

          <h3 className="settings__section-sub">Vessel / Mission</h3>
          <div className="settings__field-group">
            <div className="settings__field">
              <label htmlFor="vessel-name">Vessel</label>
              <input id="vessel-name" type="text" defaultValue="MV Meridian" />
            </div>
            <div className="settings__field">
              <label htmlFor="project-code">Project Code</label>
              <input id="project-code" type="text" defaultValue="NS-2024-Area7" />
            </div>
          </div>

          <h3 className="settings__section-sub">Network</h3>
          <div className="settings__field-group settings__field-group--wide">
            <div className="settings__field">
              <label htmlFor="vehicle-ip">Vehicle IP Address</label>
              <input id="vehicle-ip" type="text" defaultValue="192.168.1.10" />
              <p className="settings__field-hint">IPv4 address of the ROTV onboard computer.</p>
            </div>
            <div className="settings__field">
              <label htmlFor="telemetry-port">Telemetry Port</label>
              <input id="telemetry-port" type="number" defaultValue={8080} min={1024} max={65535} />
            </div>
          </div>
        </section>
      )}

      {/* Display */}
      {activeTab === 'display' && (
        <section className="settings__panel" aria-label="Display settings">
          <h2 className="settings__section-title">Display</h2>

          <div className="settings__field-group">
            <div className="settings__field">
              <label htmlFor="unit-system">Unit System</label>
              <select
                id="unit-system"
                value={settings.display.unitSystem}
                onChange={(e) => updateDisplay('unitSystem', e.target.value as 'metric' | 'imperial')}
              >
                <option value="metric">Metric (m, km, °C)</option>
                <option value="imperial">Imperial (ft, nm, °F)</option>
              </select>
            </div>

            <div className="settings__field">
              <label htmlFor="coord-format">Coordinate Format</label>
              <select
                id="coord-format"
                value={settings.display.coordinateFormat}
                onChange={(e) => updateDisplay('coordinateFormat', e.target.value as 'decimal' | 'dms' | 'ddm')}
              >
                <option value="decimal">Decimal Degrees (57.482100)</option>
                <option value="ddm">Degrees Decimal Minutes (57° 28.926')</option>
                <option value="dms">Degrees Minutes Seconds (57° 28' 55.6")</option>
              </select>
            </div>

            <div className="settings__field">
              <label htmlFor="depth-ref">Depth Reference</label>
              <select
                id="depth-ref"
                value={settings.display.depthReference}
                onChange={(e) => updateDisplay('depthReference', e.target.value as 'below_surface' | 'below_keel')}
              >
                <option value="below_surface">Below Sea Surface</option>
                <option value="below_keel">Below Vessel Keel</option>
              </select>
            </div>

            <div className="settings__field">
              <label htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                value={settings.display.timezone}
                onChange={(e) => updateDisplay('timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="UTC+1">UTC+1</option>
                <option value="UTC-5">UTC-5</option>
              </select>
            </div>

            <div className="settings__field">
              <label htmlFor="refresh-rate">Telemetry Refresh Rate</label>
              <select
                id="refresh-rate"
                value={settings.display.refreshRateHz}
                onChange={(e) => updateDisplay('refreshRateHz', parseInt(e.target.value))}
              >
                <option value={1}>1 Hz</option>
                <option value={5}>5 Hz</option>
                <option value={10}>10 Hz</option>
                <option value={20}>20 Hz</option>
              </select>
              <p className="settings__field-hint">Higher rates increase CPU usage.</p>
            </div>
          </div>
        </section>
      )}

      {/* Alerts */}
      {activeTab === 'alerts' && (
        <section className="settings__panel" aria-label="Alert threshold settings">
          <h2 className="settings__section-title">Alert Thresholds</h2>
          <p className="settings__intro">
            Alarms are triggered when any parameter exceeds these thresholds. Safety-critical
            thresholds should only be changed with authorisation from the Party Chief.
          </p>

          <div className="settings__field-group">
            <div className="settings__field">
              <label htmlFor="roll-threshold">Roll Alarm Threshold (°)</label>
              <input
                id="roll-threshold"
                type="number"
                step="0.5"
                min="5"
                max="45"
                value={settings.alerts.rollThresholdDeg}
                onChange={(e) => updateAlerts('rollThresholdDeg', parseFloat(e.target.value))}
              />
            </div>

            <div className="settings__field">
              <label htmlFor="pitch-threshold">Pitch Alarm Threshold (°)</label>
              <input
                id="pitch-threshold"
                type="number"
                step="0.5"
                min="5"
                max="60"
                value={settings.alerts.pitchThresholdDeg}
                onChange={(e) => updateAlerts('pitchThresholdDeg', parseFloat(e.target.value))}
              />
            </div>

            <div className="settings__field">
              <label htmlFor="min-altitude">Minimum Altitude (m)</label>
              <input
                id="min-altitude"
                type="number"
                step="0.5"
                min="1"
                max="10"
                value={settings.alerts.minAltitudeM}
                onChange={(e) => updateAlerts('minAltitudeM', parseFloat(e.target.value))}
              />
            </div>

            <div className="settings__field">
              <label htmlFor="max-depth">Maximum Depth (m)</label>
              <input
                id="max-depth"
                type="number"
                step="10"
                min="10"
                max="1000"
                value={settings.alerts.maxDepthM}
                onChange={(e) => updateAlerts('maxDepthM', parseFloat(e.target.value))}
              />
            </div>

            <div className="settings__field">
              <label htmlFor="max-tension">Maximum Cable Tension (kN)</label>
              <input
                id="max-tension"
                type="number"
                step="0.5"
                min="1"
                max="20"
                value={settings.alerts.maxTensionKn}
                onChange={(e) => updateAlerts('maxTensionKn', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <h3 className="settings__section-sub">Notification Modes</h3>
          <div className="settings__toggles">
            <label className="settings__toggle">
              <input
                type="checkbox"
                checked={settings.alerts.enableAudioAlerts}
                onChange={(e) => updateAlerts('enableAudioAlerts', e.target.checked)}
              />
              <span className="settings__toggle-slider" aria-hidden="true" />
              <span>Audio alerts</span>
            </label>
            <label className="settings__toggle">
              <input
                type="checkbox"
                checked={settings.alerts.enableVisualFlash}
                onChange={(e) => updateAlerts('enableVisualFlash', e.target.checked)}
              />
              <span className="settings__toggle-slider" aria-hidden="true" />
              <span>Visual flash on critical alarm</span>
            </label>
          </div>
        </section>
      )}

      {/* About */}
      {activeTab === 'about' && (
        <section className="settings__panel settings__about" aria-label="About">
          <h2 className="settings__section-title">About ROTV Flight</h2>
          <dl className="settings__about-list">
            <div className="settings__about-row">
              <dt>Application</dt>
              <dd>ROTV Flight</dd>
            </div>
            <div className="settings__about-row">
              <dt>Version</dt>
              <dd>1.0.0-alpha</dd>
            </div>
            <div className="settings__about-row">
              <dt>Build</dt>
              <dd>2024-11-14.001</dd>
            </div>
            <div className="settings__about-row">
              <dt>Framework</dt>
              <dd>React 19 + Vite 7 + TypeScript 5.9</dd>
            </div>
            <div className="settings__about-row">
              <dt>Platform</dt>
              <dd>NaviSuite RotvFlight</dd>
            </div>
            <div className="settings__about-row">
              <dt>Instance</dt>
              <dd>{settings.instanceName}</dd>
            </div>
          </dl>
          <div className="settings__about-actions">
            <button className="btn-secondary">Check for Updates</button>
            <button className="btn-secondary">View Changelog</button>
          </div>
        </section>
      )}
    </div>
  );
}
