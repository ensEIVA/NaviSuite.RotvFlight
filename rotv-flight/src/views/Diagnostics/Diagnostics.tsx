import { StatusBadge } from '../../components/StatusBadge';
import type { DiagnosticEvent, Severity } from '../../types';
import './Diagnostics.css';

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

const EVENTS: DiagnosticEvent[] = [
  { id: 'DE-012', timestamp: '2024-11-14T08:28:14Z', subsystem: 'camera_down',    type: 'fault',           description: 'Camera Down lost video signal — no carrier detected on Ethernet port 4.',      severity: 'warning', resolved: false },
  { id: 'DE-011', timestamp: '2024-11-14T08:31:58Z', subsystem: 'usbl',           type: 'threshold_breach', description: 'USBL signal strength dropped below -80 dBm threshold for 6 consecutive pings.', severity: 'warning', resolved: false },
  { id: 'DE-010', timestamp: '2024-11-14T07:45:03Z', subsystem: 'power_supply',   type: 'threshold_breach', description: 'Supply voltage dipped to 44.8 V for 120 ms — returned to nominal.',              severity: 'info',    resolved: true  },
  { id: 'DE-009', timestamp: '2024-11-14T07:12:44Z', subsystem: 'dvl',            type: 'recovery',         description: 'DVL regained bottom-track lock after 8 s loss over rocky terrain.',              severity: 'info',    resolved: true  },
  { id: 'DE-008', timestamp: '2024-11-14T06:58:11Z', subsystem: 'imu',            type: 'config_change',    description: 'IMU heading offset updated to 2.34° by J. Mackenzie.',                          severity: 'info',    resolved: true  },
  { id: 'DE-007', timestamp: '2024-11-13T22:14:09Z', subsystem: 'comms_link',     type: 'fault',            description: 'Ethernet link intermittent — 12 packets dropped. Possible cable flex fatigue.',  severity: 'warning', resolved: true  },
  { id: 'DE-006', timestamp: '2024-11-13T18:03:55Z', subsystem: 'pressure_vessel',type: 'threshold_breach', description: 'Depth exceeded 98% of operational limit. Recovery initiated by operator.',       severity: 'critical',resolved: true  },
  { id: 'DE-005', timestamp: '2024-11-13T15:22:30Z', subsystem: 'tow_winch',      type: 'restart',          description: 'Winch controller soft reset performed. Stack overflow in tension loop.',         severity: 'warning', resolved: true  },
];

function severityToStatus(s: Severity) {
  if (s === 'ok' || s === 'info') return 'nominal' as const;
  if (s === 'warning') return 'warning' as const;
  if (s === 'critical') return 'critical' as const;
  return 'unknown' as const;
}

const TYPE_LABELS: Record<DiagnosticEvent['type'], string> = {
  fault:           'Fault',
  recovery:        'Recovery',
  threshold_breach:'Threshold Breach',
  restart:         'Restart',
  config_change:   'Config Change',
};

export function Diagnostics() {
  const activeEvents  = EVENTS.filter((e) => !e.resolved);
  const resolvedEvents = EVENTS.filter((e) => e.resolved);

  return (
    <div className="diagnostics">
      <header className="view-header">
        <div>
          <h1 className="view-title">Diagnostics</h1>
          <p className="view-subtitle">Fault events, threshold breaches, and system history</p>
        </div>
        <div className="diag__header-actions">
          <button className="btn-secondary">Export Event Log</button>
          <button className="btn-secondary">Clear Resolved</button>
        </div>
      </header>

      {/* Health snapshot cards */}
      <section className="diag__health-cards" aria-label="Subsystem health quick view">
        {[
          { label: 'IMU',             status: 'nominal'  as const },
          { label: 'DVL',             status: 'nominal'  as const },
          { label: 'USBL',            status: 'warning'  as const },
          { label: 'Sonar',           status: 'nominal'  as const },
          { label: 'Camera FWD',      status: 'nominal'  as const },
          { label: 'Camera Down',     status: 'offline'  as const },
          { label: 'Power Supply',    status: 'nominal'  as const },
          { label: 'Tow Winch',       status: 'nominal'  as const },
          { label: 'Comms Link',      status: 'nominal'  as const },
          { label: 'Pressure Vessel', status: 'nominal'  as const },
          { label: 'Ethernet Switch', status: 'nominal'  as const },
          { label: 'Altimeter',       status: 'nominal'  as const },
        ].map((sub) => (
          <div key={sub.label} className={`diag__health-chip diag__health-chip--${sub.status}`}>
            <span className="diag__health-chip-label">{sub.label}</span>
            <StatusBadge status={sub.status} size="sm" />
          </div>
        ))}
      </section>

      {/* Active events */}
      {activeEvents.length > 0 && (
        <section className="panel" aria-labelledby="diag-active-heading">
          <header className="panel__header">
            <h2 id="diag-active-heading" className="panel__title">Active Events</h2>
            <span className="diag__event-count diag__event-count--warning">{activeEvents.length} unresolved</span>
          </header>
          <div className="panel__body--noPad">
            <ul className="diag__event-list" role="list">
              {activeEvents.map((event) => (
                <li key={event.id} className={`diag__event diag__event--${event.severity}`}>
                  <div className="diag__event-marker" aria-hidden="true" />
                  <div className="diag__event-content">
                    <div className="diag__event-header">
                      <span className="diag__event-id">{event.id}</span>
                      <span className="diag__event-subsystem">{event.subsystem.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="diag__event-type">{TYPE_LABELS[event.type]}</span>
                      <time className="diag__event-time" dateTime={event.timestamp}>
                        {new Date(event.timestamp).toUTCString()}
                      </time>
                      <StatusBadge status={severityToStatus(event.severity)} label={event.severity} size="sm" />
                    </div>
                    <p className="diag__event-description">{event.description}</p>
                  </div>
                  <div className="diag__event-actions">
                    <button className="btn-secondary">Acknowledge</button>
                    <button className="btn-secondary">Investigate</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Event history */}
      <section className="panel" aria-labelledby="diag-history-heading">
        <header className="panel__header">
          <h2 id="diag-history-heading" className="panel__title">Event History</h2>
          <span className="diag__event-count">{resolvedEvents.length} resolved</span>
        </header>
        <div className="panel__body--noPad">
          <ul className="diag__event-list" role="list">
            {resolvedEvents.map((event) => (
              <li key={event.id} className={`diag__event diag__event--resolved diag__event--${event.severity}`}>
                <div className="diag__event-marker" aria-hidden="true" />
                <div className="diag__event-content">
                  <div className="diag__event-header">
                    <span className="diag__event-id">{event.id}</span>
                    <span className="diag__event-subsystem">{event.subsystem.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="diag__event-type">{TYPE_LABELS[event.type]}</span>
                    <time className="diag__event-time" dateTime={event.timestamp}>
                      {new Date(event.timestamp).toUTCString()}
                    </time>
                    <span className="diag__event-resolved-badge">Resolved</span>
                  </div>
                  <p className="diag__event-description">{event.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Diagnostic tools */}
      <section className="panel" aria-labelledby="diag-tools-heading">
        <header className="panel__header">
          <h2 id="diag-tools-heading" className="panel__title">Diagnostic Tools</h2>
        </header>
        <div className="panel__body diag__tools">
          <article className="diag__tool-card">
            <h3>Ping Subsystems</h3>
            <p>Run a connectivity check against all subsystem endpoints and report latency.</p>
            <button className="btn-secondary">Run Ping Test</button>
          </article>
          <article className="diag__tool-card">
            <h3>Replay Last Event</h3>
            <p>Load telemetry data from ±60 s around a selected fault event for review.</p>
            <button className="btn-secondary">Open Playback</button>
          </article>
          <article className="diag__tool-card">
            <h3>Restart Subsystem</h3>
            <p>Soft-restart an individual subsystem driver without interrupting the survey.</p>
            <button className="btn-warning">Select and Restart</button>
          </article>
          <article className="diag__tool-card">
            <h3>System Self-Test</h3>
            <p>Run the full automated diagnostic suite — takes approximately 90 seconds.</p>
            <button className="btn-primary">Run Self-Test</button>
          </article>
        </div>
      </section>
    </div>
  );
}
