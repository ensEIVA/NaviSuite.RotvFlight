/**
 * @file useUnits.ts — React hook for unit-aware formatting
 *
 * ## Overview
 * The primary interface between components and the unit conversion system.
 * Reads the active `unitPrefs` from `useSettingsStore` and returns two
 * functions — `fmt` and `toSI` — plus the raw `unitPrefs` map for cases
 * where lower-level access is needed.
 *
 * Components should never call `convert`, `backToSI`, or `resolveUnit` from
 * `utils/units` directly. Use this hook instead — it wires up the live prefs
 * automatically and re-renders when the user changes unit system.
 *
 * ## Common use-cases
 *
 * ### 1. Displaying a live telemetry value
 * ```tsx
 * const { fmt } = useUnits();
 * const { value, unit } = fmt(snapshot.position.depth, 'depth');
 * // e.g. imperial → { value: 126.0, unit: 'ft' }
 *
 * return <span>{value.toFixed(1)} {unit}</span>;
 * ```
 *
 * ### 2. Displaying a value in a table with consistent decimal places
 * ```tsx
 * const { fmt } = useUnits();
 * const { value, unit } = fmt(snapshot.waterTemp, 'temperature');
 *
 * return (
 *   <td>{value.toFixed(1)}</td>
 *   <td>{unit}</td>
 * );
 * ```
 *
 * ### 3. A user-editable input that stores SI internally
 * Store SI values in state/store; display in user units; convert back on change.
 * ```tsx
 * const { fmt, toSI } = useUnits();
 * const { value, unit } = fmt(settings.alerts.maxDepthM, 'depth');
 *
 * <label>Max Depth ({unit})</label>
 * <input
 *   value={value.toFixed(1)}
 *   onChange={e => updateAlerts('maxDepthM', toSI(parseFloat(e.target.value), 'depth'))}
 * />
 * ```
 *
 * ### 4. Showing only the unit label (e.g. in a column header)
 * ```tsx
 * const { fmt } = useUnits();
 * const { unit } = fmt(0, 'tension'); // value is irrelevant; we just need the label
 *
 * <th>Cable Tension ({unit})</th>
 * ```
 *
 * ### 5. Reading raw prefs (e.g. for a unit-diff preview)
 * ```tsx
 * const { unitPrefs } = useUnits();
 * const key = resolveUnit('depth', unitPrefs); // → 'ft'
 * ```
 */

import { useSettingsStore } from '../stores/useSettingsStore';
import { convert, backToSI, getLabel, resolveUnit } from '../utils/units';

export function useUnits() {
  const { unitPrefs } = useSettingsStore();

  return {
    /**
     * Format an SI value for display in the user's current unit system.
     *
     * @param value    Raw SI value from state or telemetry
     * @param quantity Registered quantity name, e.g. `'depth'`, `'temperature'`
     * @returns        `{ value: number, unit: string }` — call `.toFixed()` on value before rendering
     */
    fmt: (value: number, quantity: string) => {
      const unitKey = resolveUnit(quantity, unitPrefs);
      return { value: convert(value, quantity, unitKey), unit: getLabel(quantity, unitKey) };
    },

    /**
     * Convert a display-unit value back to SI for writing to state or sending
     * to the server. Always store the result, never the raw user input.
     *
     * @param value    Value as entered by the user (in display units)
     * @param quantity Registered quantity name
     * @returns        SI value ready to store
     */
    toSI: (value: number, quantity: string) => {
      const unitKey = resolveUnit(quantity, unitPrefs);
      return backToSI(value, quantity, unitKey);
    },

    /**
     * The raw unit preferences map. Use when you need the unit key directly
     * rather than going through `fmt`, e.g. for calling `resolveUnit` or
     * `getLabel` from `utils/units` in non-render logic.
     */
    unitPrefs,
  };
}
