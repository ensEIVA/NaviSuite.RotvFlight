import type { LogEntry } from '../types';
import { transport } from './transport';
import { getLogClient } from './clients';
import { LogLevel } from '../gen/rotv/v1/common_pb';

function mapLogLevel(l: LogLevel): LogEntry['level'] {
  switch (l) {
    case LogLevel.DEBUG:    return 'debug';
    case LogLevel.INFO:     return 'info';
    case LogLevel.WARN:     return 'warn';
    case LogLevel.ERROR:    return 'error';
    case LogLevel.CRITICAL: return 'critical';
    default:                return 'info';
  }
}

const FALLBACK_LOGS: LogEntry[] = [
  { id: 'L-1001', timestamp: '2024-11-14T08:32:01.412Z', level: 'info',     source: 'telemetry',    message: 'Telemetry snapshot received. Depth 38.4 m, altitude 5.2 m.' },
  { id: 'L-1000', timestamp: '2024-11-14T08:31:58.820Z', level: 'warn',     source: 'usbl',         message: 'USBL signal strength below threshold: -82 dBm (limit -80 dBm).' },
  { id: 'L-0999', timestamp: '2024-11-14T08:31:55.001Z', level: 'info',     source: 'dvl',          message: 'DVL bottom-track lock maintained. Altitude 5.1 m.' },
  { id: 'L-0998', timestamp: '2024-11-14T08:31:45.300Z', level: 'debug',    source: 'comms',        message: 'Heartbeat ACK received from ROTV-01. RTT 18 ms.' },
  { id: 'L-0997', timestamp: '2024-11-14T08:28:14.100Z', level: 'error',    source: 'camera_down',  message: 'Video signal lost on camera_down. No carrier on eth4.' },
  { id: 'L-0996', timestamp: '2024-11-14T08:12:33.700Z', level: 'info',     source: 'mission',      message: 'Line 04 recording started. Operator: J. Mackenzie.' },
  { id: 'L-0995', timestamp: '2024-11-14T07:58:00.000Z', level: 'info',     source: 'mission',      message: 'Line 03 recording completed. Duration 46m 22s, 2400 m surveyed.' },
  { id: 'L-0994', timestamp: '2024-11-14T07:45:03.210Z', level: 'warn',     source: 'power_supply', message: 'Voltage transient: 44.8 V for 120 ms. Auto-recovered.' },
  { id: 'L-0993', timestamp: '2024-11-14T07:12:44.055Z', level: 'warn',     source: 'dvl',          message: 'DVL bottom-track lost for 8 s. Re-acquired.' },
  { id: 'L-0992', timestamp: '2024-11-14T06:58:11.000Z', level: 'info',     source: 'calibration',  message: 'IMU heading offset updated: 2.34°. Operator: J. Mackenzie.' },
  { id: 'L-0991', timestamp: '2024-11-14T06:50:00.000Z', level: 'info',     source: 'preflight',    message: 'All pre-flight checks passed. System cleared for operations.' },
];

export async function getLogs(systemId: string): Promise<LogEntry[]> {
  if (!transport) return FALLBACK_LOGS;

  const response = await getLogClient().getLogs({ systemId });
  return response.entries.map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    level: mapLogLevel(e.level),
    source: e.source,
    message: e.message,
  }));
}

export function tailLogs(
  systemId: string,
  onEntry: (entry: LogEntry) => void,
): () => void {
  if (!transport) return () => {};

  const ctrl = new AbortController();

  (async () => {
    try {
      for await (const e of getLogClient().tailLogs(
        { systemId },
        { signal: ctrl.signal },
      )) {
        onEntry({
          id: e.id,
          timestamp: e.timestamp,
          level: mapLogLevel(e.level),
          source: e.source,
          message: e.message,
        });
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        console.error('[logService] stream error', err);
      }
    }
  })();

  return () => ctrl.abort();
}
