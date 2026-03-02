import type { DiagnosticEvent, SystemHealthSnapshot } from '../types';
import { transport } from './transport';
import { getDiagnosticsClient } from './clients';
import { Severity, SystemStatus } from '../gen/rotv/v1/common_pb';

// ---------------------------------------------------------------------------
// Proto → domain mapping helpers
// ---------------------------------------------------------------------------

function mapSeverity(s: Severity): DiagnosticEvent['severity'] {
  switch (s) {
    case Severity.INFO:     return 'info';
    case Severity.OK:       return 'ok';
    case Severity.WARNING:  return 'warning';
    case Severity.CRITICAL: return 'critical';
    default:                return 'info';
  }
}

function mapSystemStatus(s: SystemStatus): SystemHealthSnapshot['overallStatus'] {
  switch (s) {
    case SystemStatus.NOMINAL:  return 'nominal';
    case SystemStatus.WARNING:  return 'warning';
    case SystemStatus.CRITICAL: return 'critical';
    case SystemStatus.OFFLINE:  return 'offline';
    default:                    return 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const FALLBACK_EVENTS: DiagnosticEvent[] = [
  { id: 'DE-012', timestamp: '2024-11-14T08:28:14Z', subsystem: 'camera_down',     type: 'fault',            description: 'Camera Down lost video signal — no carrier detected on Ethernet port 4.',      severity: 'warning',  resolved: false },
  { id: 'DE-011', timestamp: '2024-11-14T08:31:58Z', subsystem: 'usbl',            type: 'threshold_breach', description: 'USBL signal strength dropped below -80 dBm threshold for 6 consecutive pings.', severity: 'warning',  resolved: false },
  { id: 'DE-010', timestamp: '2024-11-14T07:45:03Z', subsystem: 'power_supply',    type: 'threshold_breach', description: 'Supply voltage dipped to 44.8 V for 120 ms — returned to nominal.',              severity: 'info',     resolved: true  },
  { id: 'DE-009', timestamp: '2024-11-14T07:12:44Z', subsystem: 'dvl',             type: 'recovery',         description: 'DVL regained bottom-track lock after 8 s loss over rocky terrain.',              severity: 'info',     resolved: true  },
  { id: 'DE-008', timestamp: '2024-11-14T06:58:11Z', subsystem: 'imu',             type: 'config_change',    description: 'IMU heading offset updated to 2.34° by J. Mackenzie.',                          severity: 'info',     resolved: true  },
  { id: 'DE-007', timestamp: '2024-11-13T22:14:09Z', subsystem: 'comms_link',      type: 'fault',            description: 'Ethernet link intermittent — 12 packets dropped. Possible cable flex fatigue.',  severity: 'warning',  resolved: true  },
  { id: 'DE-006', timestamp: '2024-11-13T18:03:55Z', subsystem: 'pressure_vessel', type: 'threshold_breach', description: 'Depth exceeded 98% of operational limit. Recovery initiated by operator.',       severity: 'critical', resolved: true  },
  { id: 'DE-005', timestamp: '2024-11-13T15:22:30Z', subsystem: 'tow_winch',       type: 'restart',          description: 'Winch controller soft reset performed. Stack overflow in tension loop.',         severity: 'warning',  resolved: true  },
];

export async function getEvents(systemId: string): Promise<DiagnosticEvent[]> {
  if (!transport) return FALLBACK_EVENTS;

  const response = await getDiagnosticsClient().getEvents({ systemId });
  return response.events.map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    subsystem: e.subsystem as DiagnosticEvent['subsystem'],
    type: e.type as DiagnosticEvent['type'],
    description: e.description,
    severity: mapSeverity(e.severity),
    resolved: e.resolved,
  }));
}

export function streamEvents(
  systemId: string,
  onEvent: (event: DiagnosticEvent) => void,
): () => void {
  if (!transport) return () => {};

  const ctrl = new AbortController();

  (async () => {
    try {
      for await (const e of getDiagnosticsClient().streamEvents(
        { systemId },
        { signal: ctrl.signal },
      )) {
        onEvent({
          id: e.id,
          timestamp: e.timestamp,
          subsystem: e.subsystem as DiagnosticEvent['subsystem'],
          type: e.type as DiagnosticEvent['type'],
          description: e.description,
          severity: mapSeverity(e.severity),
          resolved: e.resolved,
        });
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        console.error('[diagnosticsService] stream error', err);
      }
    }
  })();

  return () => ctrl.abort();
}

export async function getHealth(systemId: string): Promise<SystemHealthSnapshot | null> {
  if (!transport) return null;

  const snap = await getDiagnosticsClient().getHealth({ systemId });
  return {
    overallStatus: mapSystemStatus(snap.overallStatus),
    timestamp: snap.timestamp,
    subsystems: snap.subsystems.map((s) => ({
      id: s.id as SystemHealthSnapshot['subsystems'][number]['id'],
      label: s.label,
      status: mapSystemStatus(s.status),
      lastUpdated: s.lastUpdated,
      message: s.message,
      firmwareVersion: s.firmwareVersion,
      latencyMs: s.latencyMs,
    })),
  };
}
