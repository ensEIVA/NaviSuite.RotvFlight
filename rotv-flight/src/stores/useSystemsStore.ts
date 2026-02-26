import { create } from 'zustand';
import type { SystemEntry } from '../types';

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

interface SystemsStore {
  connectedSystems: SystemEntry[];
  selectedSystems: SystemEntry[];

  connectSystem:    (system: SystemEntry) => void;
  disconnectSystem: (id: string) => void;
  selectSystem:     (system: SystemEntry) => void;
  deselectSystem:   (id: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSystemsStore = create<SystemsStore>((set) => ({
  connectedSystems: [],
  selectedSystems: [],

  connectSystem: (system) =>
    set((state) => {
      const connIdx = state.connectedSystems.findIndex((s) => s.id === system.id);
      const connectedSystems = connIdx !== -1
        ? state.connectedSystems.with(connIdx, system)
        : [...state.connectedSystems, system];

      // If this system is already selected, keep its entry in sync with the fresh data
      const selIdx = state.selectedSystems.findIndex((s) => s.id === system.id);
      const selectedSystems = selIdx !== -1
        ? state.selectedSystems.with(selIdx, system)
        : state.selectedSystems;

      return { connectedSystems, selectedSystems };
    }),

  disconnectSystem: (id) =>
    set((state) => ({
      connectedSystems: state.connectedSystems.filter((s) => s.id !== id),
      // A disconnected system cannot remain selected
      selectedSystems: state.selectedSystems.filter((s) => s.id !== id),
    })),

  selectSystem: (system) =>
    set((state) => {
      const idx = state.selectedSystems.findIndex((s) => s.id === system.id);
      if (idx !== -1) {
        return { selectedSystems: state.selectedSystems.with(idx, system) };
      }
      return { selectedSystems: [...state.selectedSystems, system] };
    }),

  deselectSystem: (id) =>
    set((state) => ({
      selectedSystems: state.selectedSystems.filter((s) => s.id !== id),
    })),
}));
