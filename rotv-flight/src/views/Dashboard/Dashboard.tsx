import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../stores/useProjectStore';
import { useOperationStore } from '../../stores/useOperationStore';
import './Dashboard.css';

// ---------------------------------------------------------------------------
// Flight mode types
// ---------------------------------------------------------------------------

type FlightMode = 'parking' | 'fixed-depth' | 'follow-seabed' | 'ondulation';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Dashboard() {
  const [activeMode, setActiveMode] = useState<FlightMode>('parking');

  const { projects, activeProjectId } = useProjectStore();
  const { operations, activeOperationId } = useOperationStore();

  const activeProject   = projects.find((p) => p.id === activeProjectId);
  const activeOperation = operations.find((op) => op.id === activeOperationId);

  // Flight mode field state
  const [fixedDepth, setFixedDepth]       = useState<number>(15);
  const [altOffset, setAltOffset]         = useState<number>(2);
  const [minDepth, setMinDepth]           = useState<number>(10);
  const [maxDepth, setMaxDepth]           = useState<number>(30);

  return (
    <div className="dashboard-v2">

      {/* Active project / operation context bar */}
      <div className="dashboard-v2__context-bar">
        <span className="context-bar__item">
          <span className="context-bar__label">Project</span>
          <span className="context-bar__value">
            {activeProject ? activeProject.name : <em>None</em>}
          </span>
        </span>
        <span className="context-bar__separator" aria-hidden="true">›</span>
        <span className="context-bar__item">
          <span className="context-bar__label">Operation</span>
          <span className="context-bar__value">
            {activeOperation ? activeOperation.name : <em>None</em>}
          </span>
        </span>
        <Link to="/projects" className="context-bar__link">Manage</Link>
      </div>

      {/* ----------------------------------------------------------------
          Left aside — flight mode fieldsets
          ---------------------------------------------------------------- */}
      <aside className="dashboard-v2__aside" aria-label="Flight mode controls">

        {/* 1. Parking */}
        <fieldset
          className={`mode-fieldset${activeMode === 'parking' ? ' mode-fieldset--active' : ''}`}
          aria-label="Parking mode"
        >
          <legend className="mode-fieldset__legend">Parking</legend>
          <p className="mode-fieldset__desc">Hold current position with zero forward drive.</p>
          <button
            className={`btn-lg mode-fieldset__cta ${activeMode === 'parking' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveMode('parking')}
            aria-pressed={activeMode === 'parking'}
          >
            {activeMode === 'parking' ? 'Parking Active' : 'Engage Parking'}
          </button>
        </fieldset>

        {/* 2. Fixed Depth */}
        <fieldset
          className={`mode-fieldset${activeMode === 'fixed-depth' ? ' mode-fieldset--active' : ''}`}
          aria-label="Fixed depth mode"
        >
          <legend className="mode-fieldset__legend">Fixed Depth</legend>
          <p className="mode-fieldset__desc">Maintain a constant target depth.</p>
          <div className="mode-fieldset__field">
            <label htmlFor="fixed-depth-input" className="mode-fieldset__label">
              Target depth (m)
            </label>
            <input
              id="fixed-depth-input"
              type="number"
              min={0}
              max={500}
              step={0.5}
              value={fixedDepth}
              onChange={(e) => setFixedDepth(Number(e.target.value))}
              className="mode-fieldset__input"
            />
          </div>
          <button
            className={`btn-lg mode-fieldset__cta ${activeMode === 'fixed-depth' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveMode('fixed-depth')}
            aria-pressed={activeMode === 'fixed-depth'}
          >
            {activeMode === 'fixed-depth' ? `Holding ${fixedDepth} m` : 'Set Depth'}
          </button>
        </fieldset>

        {/* 3. Follow Seabed */}
        <fieldset
          className={`mode-fieldset${activeMode === 'follow-seabed' ? ' mode-fieldset--active' : ''}`}
          aria-label="Follow seabed mode"
        >
          <legend className="mode-fieldset__legend">Follow Seabed</legend>
          <p className="mode-fieldset__desc">Track the seabed at a fixed altitude offset.</p>
          <div className="mode-fieldset__field">
            <label htmlFor="alt-offset-input" className="mode-fieldset__label">
              Altitude offset (m)
            </label>
            <input
              id="alt-offset-input"
              type="number"
              min={0.5}
              max={50}
              step={0.5}
              value={altOffset}
              onChange={(e) => setAltOffset(Number(e.target.value))}
              className="mode-fieldset__input"
            />
          </div>
          <button
            className={`btn-lg mode-fieldset__cta ${activeMode === 'follow-seabed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveMode('follow-seabed')}
            aria-pressed={activeMode === 'follow-seabed'}
          >
            {activeMode === 'follow-seabed' ? `Following +${altOffset} m` : 'Engage'}
          </button>
        </fieldset>

        {/* 4. Ondulation */}
        <fieldset
          className={`mode-fieldset${activeMode === 'ondulation' ? ' mode-fieldset--active' : ''}`}
          aria-label="Ondulation mode"
        >
          <legend className="mode-fieldset__legend">Ondulation</legend>
          <p className="mode-fieldset__desc">Oscillate between min and max depth boundaries.</p>
          <div className="mode-fieldset__field">
            <label htmlFor="min-depth-input" className="mode-fieldset__label">
              Min depth (m)
            </label>
            <input
              id="min-depth-input"
              type="number"
              min={0}
              max={maxDepth - 1}
              step={0.5}
              value={minDepth}
              onChange={(e) => setMinDepth(Number(e.target.value))}
              className="mode-fieldset__input"
            />
          </div>
          <div className="mode-fieldset__field">
            <label htmlFor="max-depth-input" className="mode-fieldset__label">
              Max depth (m)
            </label>
            <input
              id="max-depth-input"
              type="number"
              min={minDepth + 1}
              max={500}
              step={0.5}
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="mode-fieldset__input"
            />
          </div>
          <button
            className={`btn-lg mode-fieldset__cta ${activeMode === 'ondulation' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveMode('ondulation')}
            aria-pressed={activeMode === 'ondulation'}
          >
            {activeMode === 'ondulation'
              ? `Ondulating ${minDepth}–${maxDepth} m`
              : 'Engage'}
          </button>
        </fieldset>
      </aside>

      {/* ----------------------------------------------------------------
          Main body — charts + attitude indicators
          ---------------------------------------------------------------- */}
      <main className="dashboard-v2__main">

        {/* Chart placeholders */}
        <section className="dashboard-v2__charts" aria-label="Operational charts">

          <div className="chart-placeholder" aria-label="Depth Monitor chart placeholder">
            <div className="chart-placeholder__label">
              <span className="chart-placeholder__title">Depth Monitor</span>
              <span className="chart-placeholder__note">PLACEHOLDER — live chart will render here</span>
            </div>
          </div>

          <div className="chart-placeholder" aria-label="Track Offset chart placeholder">
            <div className="chart-placeholder__label">
              <span className="chart-placeholder__title">Track Offset</span>
              <span className="chart-placeholder__note">PLACEHOLDER — live chart will render here</span>
            </div>
          </div>
        </section>

        {/* Attitude indicators */}
        <section className="dashboard-v2__attitude" aria-label="Attitude indicators">

          <AttitudeIndicator
            label="Pitch"
            value={3.2}
            unit="°"
            min={-30}
            max={30}
            warnAt={20}
          />

          <AttitudeIndicator
            label="Roll"
            value={-1.7}
            unit="°"
            min={-30}
            max={30}
            warnAt={15}
          />

          <AttitudeIndicator
            label="Flap Angle"
            value={12.5}
            unit="°"
            min={-30}
            max={30}
            warnAt={25}
          />
        </section>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AttitudeIndicator sub-component
// ---------------------------------------------------------------------------

interface AttitudeIndicatorProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  warnAt: number;
}

function AttitudeIndicator({ label, value, unit, min, max, warnAt }: AttitudeIndicatorProps) {
  const range       = max - min;
  const clamped     = Math.max(min, Math.min(max, value));
  const pct         = ((clamped - min) / range) * 100;
  const isWarning   = Math.abs(value) >= warnAt;
  const valueClass  = isWarning ? 'attitude-indicator__value--warn' : 'attitude-indicator__value--ok';

  return (
    <div className="attitude-indicator" role="meter" aria-label={`${label}: ${value}${unit}`} aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}>
      <div className="attitude-indicator__header">
        <span className="attitude-indicator__label">{label}</span>
        <span className={`attitude-indicator__value ${valueClass}`}>
          {value > 0 ? '+' : ''}{value}{unit}
        </span>
      </div>

      {/* Bar track with centre marker */}
      <div className="attitude-indicator__track" aria-hidden="true">
        <div className="attitude-indicator__centre-mark" />
        <div
          className={`attitude-indicator__fill ${isWarning ? 'attitude-indicator__fill--warn' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="attitude-indicator__scale" aria-hidden="true">
        <span>{min}{unit}</span>
        <span>0{unit}</span>
        <span>+{max}{unit}</span>
      </div>
    </div>
  );
}
