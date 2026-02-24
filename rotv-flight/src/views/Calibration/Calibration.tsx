import { useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import type { CalibrationResult, CalibrationStatus } from '../../types';
import './Calibration.css';

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

const INITIAL_CALIBRATIONS: CalibrationResult[] = [
  { id: 'cal-01', subsystem: 'imu',          label: 'IMU — Heading Offset',           status: 'passed',      lastRun: '2024-11-13T14:00:00Z', operator: 'J. Mackenzie', residualError: 0.12 },
  { id: 'cal-02', subsystem: 'imu',          label: 'IMU — Roll / Pitch Bias',        status: 'passed',      lastRun: '2024-11-13T14:08:00Z', operator: 'J. Mackenzie', residualError: 0.04 },
  { id: 'cal-03', subsystem: 'dvl',          label: 'DVL — Alignment Angles',         status: 'stale',       lastRun: '2024-11-10T09:22:00Z', operator: 'S. Torvik',    residualError: 0.31, notes: 'Last run >3 days ago — recommend re-run before next survey.' },
  { id: 'cal-04', subsystem: 'dvl',          label: 'DVL — Scale Factor',             status: 'passed',      lastRun: '2024-11-13T14:30:00Z', operator: 'J. Mackenzie', residualError: 0.02 },
  { id: 'cal-05', subsystem: 'usbl',         label: 'USBL — Lever Arm Offsets',       status: 'passed',      lastRun: '2024-11-14T07:00:00Z', operator: 'S. Torvik',    residualError: 0.06 },
  { id: 'cal-06', subsystem: 'sonar',        label: 'Sonar — Sound Velocity Profile', status: 'in_progress', lastRun: '2024-11-14T08:10:00Z', operator: 'J. Mackenzie' },
  { id: 'cal-07', subsystem: 'altimeter',    label: 'Altimeter — Offset Check',       status: 'not_run',     operator: undefined },
  { id: 'cal-08', subsystem: 'pressure_vessel', label: 'Pressure Sensor — Depth Cal', status: 'passed',     lastRun: '2024-11-13T13:45:00Z', operator: 'S. Torvik',    residualError: 0.01 },
];

const STATUS_LABELS: Record<CalibrationStatus, string> = {
  not_run:     'Not Run',
  in_progress: 'In Progress',
  passed:      'Passed',
  failed:      'Failed',
  stale:       'Stale',
};

function calStatusToSystemStatus(s: CalibrationStatus) {
  if (s === 'passed')      return 'nominal' as const;
  if (s === 'failed')      return 'critical' as const;
  if (s === 'stale')       return 'warning' as const;
  if (s === 'in_progress') return 'unknown' as const;
  return 'offline' as const;
}

export function Calibration() {
  const [cals, setCals] = useState<CalibrationResult[]>(INITIAL_CALIBRATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const passedCount     = cals.filter((c) => c.status === 'passed').length;
  const staleCount      = cals.filter((c) => c.status === 'stale').length;
  const failedCount     = cals.filter((c) => c.status === 'failed').length;
  const notRunCount     = cals.filter((c) => c.status === 'not_run').length;
  const inProgressCount = cals.filter((c) => c.status === 'in_progress').length;

  function startCalibration(id: string) {
    setCals((prev) => prev.map((c) => c.id === id ? { ...c, status: 'in_progress' } : c));
    setTimeout(() => {
      setCals((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: 'passed', lastRun: new Date().toISOString(), residualError: parseFloat((Math.random() * 0.3).toFixed(3)) }
            : c
        )
      );
    }, 3500);
  }

  const selected = cals.find((c) => c.id === selectedId);

  return (
    <div className="calibration">
      <header className="view-header">
        <div>
          <h1 className="view-title">Calibration</h1>
          <p className="view-subtitle">Sensor alignment, offset and scale factor calibration</p>
        </div>
        <div className="cal__header-actions">
          <button className="btn-secondary">Run All Pending</button>
          <button className="btn-secondary">Import Cal File</button>
          <button className="btn-primary">Export Cal Report</button>
        </div>
      </header>

      {/* Summary */}
      <section className="cal__summary" aria-label="Calibration summary">
        <div className="cal__stat">
          <span className="cal__stat-value cal__stat-value--ok">{passedCount}</span>
          <span className="cal__stat-label">Passed</span>
        </div>
        <div className="cal__stat">
          <span className="cal__stat-value cal__stat-value--warning">{staleCount}</span>
          <span className="cal__stat-label">Stale</span>
        </div>
        <div className="cal__stat">
          <span className="cal__stat-value cal__stat-value--critical">{failedCount}</span>
          <span className="cal__stat-label">Failed</span>
        </div>
        <div className="cal__stat">
          <span className="cal__stat-value">{notRunCount}</span>
          <span className="cal__stat-label">Not Run</span>
        </div>
        <div className="cal__stat">
          <span className="cal__stat-value cal__stat-value--info">{inProgressCount}</span>
          <span className="cal__stat-label">In Progress</span>
        </div>
      </section>

      <div className="cal__body">
        {/* Calibration list */}
        <section className="panel cal__list-panel" aria-labelledby="cal-list-heading">
          <header className="panel__header">
            <h2 id="cal-list-heading" className="panel__title">Calibrations</h2>
          </header>
          <div className="panel__body--noPad">
            <ul className="cal__list" role="list">
              {cals.map((cal) => (
                <li key={cal.id}>
                  <button
                    className={`cal__item${selectedId === cal.id ? ' cal__item--selected' : ''}`}
                    onClick={() => setSelectedId(cal.id === selectedId ? null : cal.id)}
                  >
                    <div className="cal__item-left">
                      <span className="cal__item-label">{cal.label}</span>
                      {cal.lastRun && (
                        <span className="cal__item-meta">
                          Last run: {new Date(cal.lastRun).toLocaleDateString()} — {cal.operator}
                        </span>
                      )}
                    </div>
                    <div className="cal__item-right">
                      {cal.residualError !== undefined && (
                        <span className="cal__item-residual">±{cal.residualError.toFixed(3)}</span>
                      )}
                      <StatusBadge status={calStatusToSystemStatus(cal.status)} label={STATUS_LABELS[cal.status]} size="sm" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Detail pane */}
        <aside className="panel cal__detail-pane" aria-label="Calibration detail">
          {selected ? (
            <div className="cal__detail">
              <header className="panel__header">
                <h2 className="panel__title">{selected.label}</h2>
                <StatusBadge
                  status={calStatusToSystemStatus(selected.status)}
                  label={STATUS_LABELS[selected.status]}
                  pulse={selected.status === 'in_progress'}
                />
              </header>
              <div className="cal__detail-body">
                {/* Metadata */}
                <dl className="cal__detail-meta">
                  <div className="cal__meta-row">
                    <dt>Subsystem</dt>
                    <dd>{selected.subsystem.toUpperCase()}</dd>
                  </div>
                  <div className="cal__meta-row">
                    <dt>Status</dt>
                    <dd>{STATUS_LABELS[selected.status]}</dd>
                  </div>
                  {selected.lastRun && (
                    <div className="cal__meta-row">
                      <dt>Last Run</dt>
                      <dd>{new Date(selected.lastRun).toUTCString()}</dd>
                    </div>
                  )}
                  {selected.operator && (
                    <div className="cal__meta-row">
                      <dt>Operator</dt>
                      <dd>{selected.operator}</dd>
                    </div>
                  )}
                  {selected.residualError !== undefined && (
                    <div className="cal__meta-row">
                      <dt>Residual Error</dt>
                      <dd className={selected.residualError > 0.2 ? 'text-warning' : 'text-ok'}>
                        ± {selected.residualError.toFixed(3)} m
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Stale warning */}
                {selected.notes && (
                  <div className="cal__notes-box">
                    <h3>Notes</h3>
                    <p>{selected.notes}</p>
                  </div>
                )}

                {/* In-progress progress indicator */}
                {selected.status === 'in_progress' && (
                  <div className="cal__progress-section">
                    <p className="cal__progress-text">Calibration in progress...</p>
                    <div className="cal__progress-bar">
                      <div className="cal__progress-fill" />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="cal__detail-actions">
                  <button
                    className="btn-primary btn-lg"
                    disabled={selected.status === 'in_progress'}
                    onClick={() => startCalibration(selected.id)}
                  >
                    {selected.status === 'in_progress' ? 'Running...' : 'Run Calibration'}
                  </button>
                  <button className="btn-secondary">View History</button>
                  <button className="btn-secondary">Manual Override</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="cal__detail-empty">
              <p>Select a calibration to view details and run it.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
