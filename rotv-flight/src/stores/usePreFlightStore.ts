import { create } from 'zustand';
import type { PreFlightCheck, SystemEntry } from '../types';
import { runCheck } from '../services/mockPreflightService';
import { transport } from '../services/transport';
import { runSession } from '../services/preflightService';

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

interface PreFlightStore {
  /** All checks keyed by system id */
  checksBySystem: Record<string, PreFlightCheck[]>;
  isRunning: boolean;

  /** Populate checks for each selected system (resets existing checks) */
  loadChecks: (systems: SystemEntry[]) => void;

  /** Run every check: server-streaming when gRPC is on, mock loop otherwise */
  runAllChecks: (systems: SystemEntry[]) => Promise<void>;

  /** Clear all state */
  reset: () => void;

  /** True when every check across all supplied systems has status 'passed' */
  allPassed: (systems: SystemEntry[]) => boolean;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePreFlightStore = create<PreFlightStore>((set, get) => ({
  checksBySystem: {},
  isRunning: false,

  loadChecks: (systems) => {
    const checksBySystem: Record<string, PreFlightCheck[]> = {};
    for (const system of systems) {
      console.log(`Loading checks for system ${system.name} (${system.id})`, system.checks);
      checksBySystem[system.id] = (system.checks ?? []).map((c) => ({
        ...c,
        status: 'pending' as const,
        completedAt: undefined,
      }));
    }
    set({ checksBySystem });
  },

  runAllChecks: async (systems) => {
    if (get().isRunning) return;
    set({ isRunning: true });

    // Reset all checks to pending before starting
    set((state) => {
      const reset: Record<string, PreFlightCheck[]> = {};
      for (const system of systems) {
        reset[system.id] = (state.checksBySystem[system.id] ?? []).map((c) => ({
          ...c,
          status: 'pending' as const,
          completedAt: undefined,
        }));
      }
      return { checksBySystem: reset };
    });

    if (transport) {
      // --- ConnectRPC path: server drives sequencing ---
      const ctrl = new AbortController();
      try {
        for await (const update of runSession(
          systems.map((s) => s.id),
          ctrl.signal,
        )) {
          set((state) => ({
            checksBySystem: {
              ...state.checksBySystem,
              [update.systemId]: (state.checksBySystem[update.systemId] ?? []).map((c) =>
                c.id === update.checkId
                  ? {
                      ...c,
                      status: update.status,
                      completedAt: update.completedAt || undefined,
                    }
                  : c,
              ),
            },
          }));
        }
      } catch (err) {
        console.error('[usePreFlightStore] runSession error', err);
      }
    } else {
      // --- Mock path: sequential loop ---
      for (const system of systems) {
        const checks = get().checksBySystem[system.id] ?? [];

        for (const check of checks) {
          set((state) => ({
            checksBySystem: {
              ...state.checksBySystem,
              [system.id]: state.checksBySystem[system.id].map((c) =>
                c.id === check.id ? { ...c, status: 'running' as const } : c,
              ),
            },
          }));

          const result = await runCheck(check);

          set((state) => ({
            checksBySystem: {
              ...state.checksBySystem,
              [system.id]: state.checksBySystem[system.id].map((c) =>
                c.id === check.id
                  ? { ...c, status: result, completedAt: new Date().toISOString() }
                  : c,
              ),
            },
          }));
        }
      }
    }

    set({ isRunning: false });
  },

  reset: () => set({ checksBySystem: {}, isRunning: false }),

  allPassed: (systems) => {
    const { checksBySystem } = get();
    return systems.every((s) =>
      (checksBySystem[s.id] ?? []).length > 0 &&
      (checksBySystem[s.id] ?? []).every((c) => c.status === 'passed'),
    );
  },
}));
