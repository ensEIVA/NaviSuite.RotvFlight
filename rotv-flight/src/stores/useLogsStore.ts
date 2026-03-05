/**
 * @file useLogsStore.ts — Centralised log entry store
 *
 * ## Responsibilities
 * Single owner of all log data for the active session. Log entries come from
 * two distinct sources that are merged into one `entries` array:
 *
 * ### 1. Server stream (hardware / system events)
 * Continuous entries pushed by the ROTV over gRPC:
 *  - Historical backlog fetched once via `getLogs()` on mount
 *  - New entries streamed live via `tailLogs()` (like `tail -f`)
 *  - Examples: depth readings, DVL lock events, power faults
 *
 * ### 2. Frontend injection (user-initiated actions)
 * Single-occurrence entries written directly from UI code via `logEvent()`.
 * These never touch the server — they are local to this session only.
 *  - Examples: operator clicks "Save Settings", starts pre-flight, changes unit system
 *
 * `load()` is called once at app startup in `App.tsx` and runs for the entire
 * session — entries accumulate regardless of which view is active. The Logs
 * view is a pure reader; it never starts or stops the stream.
 * Filtering (level, source, search) is done client-side at render time — no
 * round-trips for filter changes.
 *
 * ## Status lifecycle
 * ```
 * 'idle'      — initial state; no connection open
 *     ↓  load() called
 * 'loading'   — getLogs() backlog fetch in flight; entries are empty
 *     ↓  backlog resolves
 * 'streaming' — tailLogs() stream open; entries grow as events arrive
 *     ↓  stop() called (view unmounts) or error
 * 'idle' / 'error'
 * ```
 *
 * Use `status` to drive UI feedback:
 * - `'loading'`   → show a spinner or skeleton in the log table
 * - `'streaming'` → show the pulsing Live indicator
 * - `'error'`     → show an inline error message
 * - `'idle'`      → no indicator needed (stream closed cleanly)
 *
 * ## Frontend log injection
 * Any module can inject a user-action entry via `logEvent` in `utils/logger`:
 * ```ts
 * import { logEvent } from '../../utils/logger';
 * logEvent('info', 'settings', 'Unit system changed to imperial');
 * logEvent('warn', 'preflight', 'Compass calibration failed');
 * ```
 * The entry routes through Pino before landing here, so level filtering and
 * remote transports work automatically. It is NOT sent to the server and will
 * not appear in a future `getLogs()` response — it is ephemeral.
 */

import { create } from 'zustand';
import type { LogEntry } from '../types';
import { getLogs, tailLogs } from '../services/logService';

/** Maximum number of entries kept in memory. Oldest are dropped when exceeded. */
const MAX_ENTRIES = 2000;

interface LogsState {
  entries: LogEntry[];
  /**
   * - `'idle'`      — no connection open (initial or after stop)
   * - `'loading'`   — backlog fetch (getLogs) in flight; entries not yet populated
   * - `'streaming'` — tailLogs stream open; new entries arriving live
   * - `'error'`     — getLogs threw; stream was never opened
   */
  status:  'idle' | 'loading' | 'streaming' | 'error';
  systemId: string;

  /**
   * Fetch the historical backlog then open a live tail stream for `systemId`.
   * Replaces any previously active stream. Safe to call multiple times.
   */
  load: (systemId: string) => Promise<void>;

  /**
   * Stop the active tail stream. Does not clear entries — call `clearLocal`
   * separately if you want to reset the view.
   */
  stop: () => void;

  /**
   * Prepend a single entry and trim to MAX_ENTRIES. Called by the tail stream
   * callback and by `logEvent()` for frontend-injected entries.
   */
  addEntry: (entry: LogEntry) => void;

  /** Discard all in-memory entries without touching the server. */
  clearLocal: () => void;
}

// Module-level refs so we can cancel the stream without storing in Zustand state.
// `currentLoadId` acts as a generation counter: any async continuation that finds
// its loadId stale knows a newer load() call has superseded it and bails out.
// This prevents the React Strict Mode double-invoke from leaving a ghost stream.
let stopCurrentStream: (() => void) | null = null;
let currentLoadId = 0;

export const useLogsStore = create<LogsState>((set, get) => ({
  entries:  [],
  status:   'idle',
  systemId: '',

  load: async (systemId) => {
    // Cancel any stream from a previous load call.
    stopCurrentStream?.();
    stopCurrentStream = null;

    const loadId = ++currentLoadId;

    set({ systemId, status: 'loading', entries: [] });

    // --- Historical backlog ---
    try {
      const backlog = await getLogs(systemId);
      if (loadId !== currentLoadId) return; // superseded by a newer load()
      set({ entries: backlog });
    } catch (err) {
      if (loadId !== currentLoadId) return;
      console.error('[useLogsStore] getLogs error', err);
      set({ status: 'error' });
      return;
    }

    if (loadId !== currentLoadId) return;

    // --- Live tail ---
    set({ status: 'streaming' });
    stopCurrentStream = tailLogs(systemId, (entry) => {
      if (loadId !== currentLoadId) return; // stale stream — discard
      get().addEntry(entry);
    }, (err) => {
      if(loadId !== currentLoadId) return;
      console.error('[useLogsStore] tailLogs error', err);
      set({ status: 'error' });
    });
  },

  stop: () => {
    stopCurrentStream?.();
    stopCurrentStream = null;
    set({ status: 'idle' });
  },

  addEntry: (entry) => {
    set((state) => ({
      entries: [entry, ...state.entries].slice(0, MAX_ENTRIES),
    }));
  },

  clearLocal: () => set({ entries: [] }),
}));

// ---------------------------------------------------------------------------
// Frontend log injection
// ---------------------------------------------------------------------------
// Use `logEvent` from `src/utils/logger.ts` — not from this file.
// It routes through Pino before writing here, enabling level filtering,
// child loggers, and remote transports without touching call sites.
