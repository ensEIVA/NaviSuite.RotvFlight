import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SystemSettings } from '../types';
import { getSettings, saveSettings } from '../services/settingsService';
import { applyPreset as computePreset, type UnitPrefs } from '../utils/units';

interface SettingsState {
  settings:   SystemSettings | null;
  unitPrefs:  UnitPrefs;
  status:     'idle' | 'loading' | 'error';

  /** Fetch settings from server, derive unitPrefs from preset. */
  load:            () => Promise<void>;
  /** Persist current settings to server. */
  save:            () => Promise<boolean>;
  /** Update the in-memory settings object (used by Settings view live edits). */
  setSettings:     (s: SystemSettings) => void;
  /** Expand a preset name to per-quantity prefs and sync settings.display.unitSystem. */
  applyPreset:     (preset: string) => void;
  /** Override a single quantity's unit key (fine-grained control). */
  setQuantityUnit: (quantity: string, key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings:  null,
      unitPrefs: computePreset('metric'),
      status:    'idle',

      load: async () => {
        set({ status: 'loading' });
        try {
          const s = await getSettings();
          set({
            settings:  s,
            unitPrefs: computePreset(s.display.unitSystem),
            status:    'idle',
          });
        } catch {
          set({ status: 'error' });
        }
      },

      save: async () => {
        const { settings } = get();
        if (!settings) return false;
        try {
          return await saveSettings(settings);
        } catch {
          return false;
        }
      },

      setSettings: (s) => set({ settings: s }),

      applyPreset: (preset) => {
        const { settings } = get();
        set({
          unitPrefs: computePreset(preset),
          settings: settings
            ? { ...settings, display: { ...settings.display, unitSystem: preset as SystemSettings['display']['unitSystem'] } }
            : settings,
        });
      },

      setQuantityUnit: (quantity, key) => {
        set((state) => ({ unitPrefs: { ...state.unitPrefs, [quantity]: key } }));
      },
    }),
    {
      name: 'display-prefs',
      partialize: (state) => ({ unitPrefs: state.unitPrefs }),
    },
  ),
);
