import { create } from 'zustand';
import type { PreFlightCheck, SystemEntry } from '../types';
import { runCheck } from '../services/mockPreflightService';

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

interface PreFlightStore {
  /** All checks keyed by system id */
  checksBySystem: Record<string, PreFlightCheck[]>;
  isRunning: boolean;

  /** Populate checks for each selected system (resets existing checks) */
  loadChecks: (systems: SystemEntry[]) => void;

  /** Run every check sequentially: system by system, check by check */
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
      // Checks are advertised by the system on discovery — reset status to pending
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

    // Sequential: system → check
    for (const system of systems) {
      const checks = get().checksBySystem[system.id] ?? [];

      for (const check of checks) {
        // Mark as running
        set((state) => ({
          checksBySystem: {
            ...state.checksBySystem,
            [system.id]: state.checksBySystem[system.id].map((c) =>
              c.id === check.id ? { ...c, status: 'running' as const } : c,
            ),
          },
        }));

        const result = await runCheck(check);

        // Record result
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
