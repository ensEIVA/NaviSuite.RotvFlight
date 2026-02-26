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
      if (state.connectedSystems.some((s) => s.id === system.id)) return state;
      return { connectedSystems: [...state.connectedSystems, system] };
    }),

  disconnectSystem: (id) =>
    set((state) => ({
      connectedSystems: state.connectedSystems.filter((s) => s.id !== id),
      // A disconnected system cannot remain selected
      selectedSystems: state.selectedSystems.filter((s) => s.id !== id),
    })),

  selectSystem: (system) =>
    set((state) => {
      if (state.selectedSystems.some((s) => s.id === system.id)) return state;
      return { selectedSystems: [...state.selectedSystems, system] };
    }),

  deselectSystem: (id) =>
    set((state) => ({
      selectedSystems: state.selectedSystems.filter((s) => s.id !== id),
    })),
}));
