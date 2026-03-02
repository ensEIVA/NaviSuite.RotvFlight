import { useEffect, useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import type { DiagnosticEvent, Severity } from '../../types';
import { getEvents } from '../../services/diagnosticsService';
import './Diagnostics.css';

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
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);

  useEffect(() => {
    getEvents('').then(setEvents).catch(console.error);
  }, []);

  const activeEvents  = events.filter((e) => !e.resolved);
  const resolvedEvents = events.filter((e) => e.resolved);

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
