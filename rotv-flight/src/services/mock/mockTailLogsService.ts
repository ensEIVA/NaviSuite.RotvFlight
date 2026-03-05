import type { LogEntry, LogLevel } from '../../types';

const LEVELS: LogLevel[] = ['debug', 'info', 'info', 'info', 'warn', 'error'];

const POOL: Array<{ source: string; message: string }> = [
  { source: 'telemetry',    message: 'Snapshot received. Depth 38.4 m, altitude 5.2 m.' },
  { source: 'telemetry',    message: 'Heading 214°, roll −0.8°, pitch 1.2°.' },
  { source: 'dvl',          message: 'Bottom-track lock maintained. Altitude 5.0 m.' },
  { source: 'dvl',          message: 'DVL altitude updated: 4.8 m.' },
  { source: 'usbl',         message: 'Position fix received. Accuracy ±1.2 m.' },
  { source: 'usbl',         message: 'USBL signal strength: −75 dBm.' },
  { source: 'comms',        message: 'Heartbeat ACK from ROTV-01. RTT 18 ms.' },
  { source: 'comms',        message: 'Keepalive sent.' },
  { source: 'mission',      message: 'Line 04 recording in progress. Distance: 1240 m.' },
  { source: 'power_supply', message: 'Voltage nominal: 48.0 V, current 12.4 A.' },
  { source: 'calibration',  message: 'IMU heading stable. Offset: 2.34°.' },
];

let counter = 2000;

/**
 * Mock implementation of `tailLogs` — emits a realistic log entry every ~2 s.
 * Used in place of the real gRPC stream when `VITE_USE_GRPC=false`.
 *
 * @returns Cleanup function that stops the interval.
 */
export function mockTailLogs(
  _systemId: string,
  onEntry: (entry: LogEntry) => void,
): () => void {
  const handle = setInterval(() => {
    const sample = POOL[Math.floor(Math.random() * POOL.length)];
    const level  = LEVELS[Math.floor(Math.random() * LEVELS.length)];

    onEntry({
      id:        `L-${String(++counter).padStart(4, '0')}`,
      timestamp: new Date().toISOString(),
      level,
      origin:    'stream',
      source:    sample.source,
      message:   sample.message,
    });
  }, 2000);

  return () => clearInterval(handle);
}
