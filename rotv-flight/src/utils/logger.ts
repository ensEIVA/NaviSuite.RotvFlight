/**
 * @file logger.ts — Application logger (Pino)
 *
 * ## Why Pino
 * Pino is the structured logging layer between call sites and the display store.
 * Using it instead of writing directly to `useLogsStore` means:
 *
 *  - **Remote transport** — add `browser.transmit` to ship logs to a server
 *    endpoint, Datadog, or any sink without touching a single call site.
 *  - **Child loggers** — `logger.child({ component: 'preflight' })` carries
 *    context automatically into every entry from that subsystem.
 *  - **Level filtering** — set `level: 'warn'` in production to silence debug
 *    noise globally, again without touching call sites.
 *
 * ## Data flow
 * ```
 * logEvent('info', 'settings', 'Saved')
 *     ↓
 * logger.info({ source: 'settings' }, 'Saved')   ← Pino
 *     ↓
 * browser.write()                                 ← our sink
 *     ↓
 * useLogsStore.addEntry()                         ← display buffer
 *     ↓
 * Logs view
 * ```
 *
 * ## Adding a remote transport (future)
 * Add a `browser.transmit` option to the Pino config below. Pino will call it
 * for every entry at or above the configured level. The rest of the app is
 * unchanged.
 *
 * @example
 * ```ts
 * browser: {
 *   transmit: {
 *     level: 'warn',
 *     send(level, logEvent) {
 *       fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEvent) });
 *     },
 *   },
 * }
 * ```
 */

import pino from 'pino';
import type { LogLevel } from '../types';
import { useLogsStore } from '../stores/useLogsStore';

// ---------------------------------------------------------------------------
// Level mapping
// ---------------------------------------------------------------------------

// Pino numeric levels: trace=10, debug=20, info=30, warn=40, error=50, fatal=60
// Our LogLevel:        debug, info, warn, error, critical
function fromPinoLevel(n: number): LogLevel {
  if (n >= 60) return 'critical'; // fatal → critical
  if (n >= 50) return 'error';
  if (n >= 40) return 'warn';
  if (n >= 30) return 'info';
  return 'debug';                 // trace + debug → debug
}

// ---------------------------------------------------------------------------
// Pino instance
// ---------------------------------------------------------------------------

export const logger = pino({
  browser: {
    /**
     * Called once per log entry. Writes the entry into `useLogsStore` so the
     * Logs view can display it. Swap or extend this to add remote transports.
     */
    write(o) {
      const obj = o as Record<string, unknown>;

      // Strip Pino's own standard keys — they are already captured in the
      // top-level LogEntry fields. What remains is the caller's structured data.
      const PINO_KEYS = new Set(['level', 'time', 'msg', 'pid', 'hostname', 'v', 'source']);
      const callerData = Object.fromEntries(
        Object.entries(obj).filter(([k]) => !PINO_KEYS.has(k)),
      );
      const details = Object.keys(callerData).length > 0 ? callerData : undefined;

      useLogsStore.getState().addEntry({
        id:        `fe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: typeof obj.time === 'number'
          ? new Date(obj.time).toISOString()
          : new Date().toISOString(),
        level:   fromPinoLevel(obj.level as number),
        origin:  'operator',
        source:  typeof obj.source === 'string' ? obj.source : 'app',
        message: typeof obj.msg === 'string' ? obj.msg : '',
        details,
      });
    },
  },
});

// ---------------------------------------------------------------------------
// Public logging helper
// ---------------------------------------------------------------------------

/**
 * Log a user-initiated action. The entry is routed through Pino and written
 * to `useLogsStore` for display in the Logs view.
 *
 * Import this from `utils/logger` — not from `stores/useLogsStore`.
 *
 * @param level   Severity level
 * @param source  Subsystem name shown in the Logs table, e.g. `'settings'`
 * @param message Human-readable description of the action
 * @param details Optional structured data attached to the entry
 *
 * @example
 * ```ts
 * import { logEvent } from '../../utils/logger';
 *
 * logEvent('info', 'settings', 'Unit system changed to imperial');
 * logEvent('warn', 'preflight', 'Compass calibration failed', { attempt: 2 });
 * ```
 */
export function logEvent(
  level:    LogLevel,
  source:   string,
  message:  string,
  details?: Record<string, unknown>,
): void {
  // Pino has no 'critical' level — map it to 'fatal'.
  const pinoLevel = level === 'critical' ? 'fatal' : level;
  logger[pinoLevel]({ source, ...details }, message);
}
