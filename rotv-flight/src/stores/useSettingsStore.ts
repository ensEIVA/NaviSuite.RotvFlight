/**
 * @file useSettingsStore.ts — Application settings + unit preferences store
 *
 * ## Responsibilities
 * Single source of truth for two concerns that travel together:
 *  1. `settings`  — the full `SystemSettings` object (instance name, alert
 *                   thresholds, display options). Loaded from the server via
 *                   `settingsService` and saved back on demand.
 *  2. `unitPrefs` — a `UnitPrefs` map derived from `settings.display.unitSystem`.
 *                   Persisted to `localStorage` so the UI renders immediately
 *                   on the next load before the server responds.
 *
 * ## Typical component usage
 * Most components only need the `useUnits()` hook — they never touch this store
 * directly. Use this store directly only when you need to read or write settings
 * fields, or react to the loading status.
 *
 * ## Switching unit systems
 * Call `applyPreset('imperial')` (or `'metric'`). This atomically updates both
 * `unitPrefs` (so every `fmt` call re-renders immediately) and
 * `settings.display.unitSystem` (so the value is included in the next `save()`).
 *
 * @example Switching preset from the Settings view
 * ```ts
 * const { applyPreset } = useSettingsStore();
 * <select onChange={e => applyPreset(e.target.value)} />
 * ```
 *
 * ## Fine-grained unit override
 * `setQuantityUnit` lets a power user override a single quantity without
 * changing the whole preset — e.g. keep metric everywhere but show depth in ft.
 *
 * @example Overriding one quantity
 * ```ts
 * const { setQuantityUnit } = useSettingsStore();
 * setQuantityUnit('depth', 'ft'); // only depth changes; rest stays metric
 * ```
 *
 * ## Persistence
 * Only `unitPrefs` is persisted (Zustand `persist` middleware, key
 * `'display-prefs'`). Full settings always come from the server — `load()`
 * is called once on app mount in `App.tsx` and overwrites the hydrated prefs
 * with whatever the server returns.
 *
 * ## Loading lifecycle
 * ```
 * App mounts
 *   → localStorage hydrates unitPrefs  (instant, from persist)
 *   → load() called
 *       → status: 'loading'
 *       → getSettings() resolves
 *       → settings set, unitPrefs re-derived from settings.display.unitSystem
 *       → status: 'idle'
 * ```
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SystemSettings } from '../types';
import { getSettings, saveSettings } from '../services/settingsService';
import { applyPreset as computePreset, type UnitPrefs } from '../utils/units';

interface SettingsState {
  settings:   SystemSettings | null;
  unitPrefs:  UnitPrefs;
  status:     'idle' | 'loading' | 'error';

  /**
   * Fetch settings from the server and derive `unitPrefs` from the returned
   * `unitSystem`. Called once on app mount. Safe to call again to refresh.
   */
  load:            () => Promise<void>;

  /**
   * Persist the current in-memory `settings` object to the server.
   * Returns `true` on success, `false` on failure.
   *
   * @example
   * ```ts
   * const ok = await save();
   * if (ok) showToast('Saved');
   * ```
   */
  save:            () => Promise<boolean>;

  /**
   * Replace the entire in-memory settings object. Used by the Settings view
   * for live field edits before the user hits Save. Does not persist to server.
   *
   * @example
   * ```ts
   * // Updating a nested display field:
   * setSettings({ ...settings, display: { ...settings.display, timezone: 'UTC+1' } });
   * ```
   */
  setSettings:     (s: SystemSettings) => void;

  /**
   * Expand a preset name to a full `UnitPrefs` map and sync
   * `settings.display.unitSystem`. Both changes happen atomically, so every
   * `fmt` call in the UI re-renders in the same React pass.
   *
   * Built-in presets: `'metric'` | `'imperial'`
   * Custom presets are supported — see `registerQuantity` in `utils/units.ts`.
   *
   * @example
   * ```ts
   * applyPreset('imperial');
   * // unitPrefs → { depth: 'ft', temperature: 'fahrenheit', tension: 'lbf', ... }
   * // settings.display.unitSystem → 'imperial'
   * ```
   */
  applyPreset:     (preset: string) => void;

  /**
   * Override a single quantity's unit key without affecting other quantities.
   * Useful for mixed-unit configurations (e.g. metric everywhere, depth in ft).
   * Note: this diverges `unitPrefs` from `settings.display.unitSystem` — that
   * is intentional and expected for power-user overrides.
   *
   * @example
   * ```ts
   * setQuantityUnit('depth', 'ft');
   * // Only depth changes; temperature, tension, etc. remain as per current preset.
   * ```
   */
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
