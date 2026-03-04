/**
 * @file units.ts — Unit conversion registry
 *
 * ## Overview
 * An open registry of physical quantities and their unit conversions.
 * All telemetry and settings values are stored internally in SI units.
 * Conversion to display units happens at render time only — never at rest.
 *
 * ## Architecture
 * The registry follows an open/closed pattern: adding a new quantity or a new
 * unit variant requires only a single `registerQuantity()` call, with zero
 * changes to existing code.
 *
 * ## Adding a new quantity
 * Call `registerQuantity()` once at module load time (top of this file or in a
 * feature module). The quantity immediately becomes available to `applyPreset`,
 * `fmt`, and `toSI` everywhere in the app.
 *
 * @example Adding a pressure quantity
 * ```ts
 * registerQuantity('pressure', {
 *   units: {
 *     pa:  { label: 'Pa',  fromSI: v => v,         toSI: v => v },
 *     bar: { label: 'bar', fromSI: v => v / 1e5,   toSI: v => v * 1e5 },
 *     psi: { label: 'psi', fromSI: v => v / 6894.8, toSI: v => v * 6894.8 },
 *   },
 *   presets:     { metric: 'bar', imperial: 'psi' },
 *   defaultUnit: 'bar',
 * });
 * ```
 *
 * ## Adding a new preset
 * Add a key to the `presets` object of every relevant quantity. Quantities that
 * don't care about the new preset will fall back to `defaultUnit` automatically.
 *
 * @example Adding a 'scientific' preset that uses SI everywhere
 * ```ts
 * // In each registerQuantity call, add:  presets: { metric: '...', imperial: '...', scientific: 'pa' }
 * // Then call:
 * applyPreset('scientific'); // → { pressure: 'pa', depth: 'm', temperature: 'celsius', ... }
 * ```
 *
 * ## Data flow
 * ```
 * Server / sensor  →  SI number stored in state
 *        ↓
 * useSettingsStore.unitPrefs  (resolved preset, e.g. { depth: 'ft', temperature: 'fahrenheit' })
 *        ↓
 * useUnits().fmt(siValue, 'depth')  →  { value: 126.0, unit: 'ft' }
 *        ↓
 * Rendered to the user
 * ```
 * Edits flow in reverse via `useUnits().toSI(displayValue, 'depth')` before
 * writing back to state.
 */

/** Per-quantity unit preferences map: quantity name → unit key. */
export type UnitPrefs = Record<string, string>;

interface UnitDef {
  label: string;
  fromSI: (v: number) => number;
  toSI:   (v: number) => number;
}

interface QuantityDef {
  units:       Record<string, UnitDef>;
  presets:     Record<string, string>;  // preset name → unit key
  defaultUnit: string;
}

const registry: Record<string, QuantityDef> = {};

/**
 * Register a measurable quantity and its available unit conversions.
 *
 * Must be called once per quantity at module load time. Safe to call multiple
 * times for the same name — later calls overwrite earlier ones.
 *
 * @param name    Camel-case quantity identifier, e.g. `'depth'`, `'temperature'`
 * @param def     Unit definitions, preset mappings, and fallback default unit
 *
 * @example
 * ```ts
 * registerQuantity('depth', {
 *   units: {
 *     m:  { label: 'm',  fromSI: v => v,          toSI: v => v },
 *     ft: { label: 'ft', fromSI: v => v * 3.28084, toSI: v => v / 3.28084 },
 *   },
 *   presets:     { metric: 'm', imperial: 'ft' },
 *   defaultUnit: 'm',
 * });
 * ```
 */
export function registerQuantity(name: string, def: QuantityDef): void {
  registry[name] = def;
}

/**
 * Expand a preset name into a full `UnitPrefs` map covering every registered
 * quantity. Quantities that don't define the requested preset fall back to
 * their `defaultUnit`.
 *
 * Called by `useSettingsStore` when the user switches unit system, and on
 * initial settings load.
 *
 * @param preset  A preset name such as `'metric'` or `'imperial'`
 * @returns       A `UnitPrefs` map, e.g. `{ depth: 'ft', temperature: 'fahrenheit', ... }`
 *
 * @example
 * ```ts
 * const prefs = applyPreset('imperial');
 * // → { depth: 'ft', temperature: 'fahrenheit', tension: 'lbf', speed: 'fts', ... }
 * ```
 */
export function applyPreset(preset: string): UnitPrefs {
  const prefs: UnitPrefs = {};
  for (const [name, def] of Object.entries(registry)) {
    prefs[name] = def.presets[preset] ?? def.defaultUnit;
  }
  return prefs;
}

/**
 * Resolve the active unit key for a quantity given a `UnitPrefs` map.
 * Falls back to the quantity's `defaultUnit` if the quantity is missing from
 * `prefs`, and to an empty string if the quantity is not registered at all.
 *
 * @example
 * ```ts
 * const prefs = applyPreset('imperial');
 * resolveUnit('depth', prefs); // → 'ft'
 * resolveUnit('salinity', prefs); // → 'psu'  (same in both presets)
 * ```
 */
export function resolveUnit(quantity: string, prefs: UnitPrefs): string {
  return prefs[quantity] ?? registry[quantity]?.defaultUnit ?? '';
}

/**
 * Convert an SI value to display units.
 * Returns the original value unchanged if the quantity or unit key is unknown.
 *
 * @param value    Raw SI value (e.g. metres, °C, kN)
 * @param quantity Quantity name as registered (e.g. `'depth'`)
 * @param unitKey  Target unit key (e.g. `'ft'`)
 *
 * @example
 * ```ts
 * convert(38.4, 'depth', 'ft');  // → 125.984...
 * convert(14.3, 'temperature', 'fahrenheit'); // → 57.74
 * ```
 */
export function convert(value: number, quantity: string, unitKey: string): number {
  return registry[quantity]?.units[unitKey]?.fromSI(value) ?? value;
}

/**
 * Convert a display-unit value back to SI for storage or transmission.
 * Use this whenever the user edits a field that is displayed in non-SI units —
 * store the return value, never the raw input.
 *
 * @param value    Value in display units (e.g. feet, °F, lbf)
 * @param quantity Quantity name as registered
 * @param unitKey  Source unit key matching what was displayed
 *
 * @example
 * ```ts
 * // User types "126" into a depth field displayed in feet:
 * backToSI(126, 'depth', 'ft'); // → 38.405...  (store this)
 * ```
 */
export function backToSI(value: number, quantity: string, unitKey: string): number {
  return registry[quantity]?.units[unitKey]?.toSI(value) ?? value;
}

/**
 * Return the human-readable unit label for a quantity + unit key combination.
 * Falls back to the unit key itself if not found.
 *
 * @example
 * ```ts
 * getLabel('temperature', 'fahrenheit'); // → '°F'
 * getLabel('depth', 'ft');               // → 'ft'
 * ```
 */
export function getLabel(quantity: string, unitKey: string): string {
  return registry[quantity]?.units[unitKey]?.label ?? unitKey;
}

// ---------------------------------------------------------------------------
// Built-in quantity registrations
// ---------------------------------------------------------------------------

registerQuantity('depth', {
  units: {
    m:  { label: 'm',  fromSI: v => v,           toSI: v => v },
    ft: { label: 'ft', fromSI: v => v * 3.28084,  toSI: v => v / 3.28084 },
  },
  presets:     { metric: 'm', imperial: 'ft' },
  defaultUnit: 'm',
});

registerQuantity('distance', {
  units: {
    m:  { label: 'm',  fromSI: v => v,           toSI: v => v },
    ft: { label: 'ft', fromSI: v => v * 3.28084,  toSI: v => v / 3.28084 },
  },
  presets:     { metric: 'm', imperial: 'ft' },
  defaultUnit: 'm',
});

registerQuantity('temperature', {
  units: {
    celsius:    { label: '°C', fromSI: v => v,                toSI: v => v },
    fahrenheit: { label: '°F', fromSI: v => v * 9 / 5 + 32,  toSI: v => (v - 32) * 5 / 9 },
  },
  presets:     { metric: 'celsius', imperial: 'fahrenheit' },
  defaultUnit: 'celsius',
});

registerQuantity('tension', {
  units: {
    kn:  { label: 'kN',  fromSI: v => v,          toSI: v => v },
    lbf: { label: 'lbf', fromSI: v => v * 224.809, toSI: v => v / 224.809 },
  },
  presets:     { metric: 'kn', imperial: 'lbf' },
  defaultUnit: 'kn',
});

registerQuantity('speed', {
  units: {
    ms:  { label: 'm/s',  fromSI: v => v,          toSI: v => v },
    fts: { label: 'ft/s', fromSI: v => v * 3.28084, toSI: v => v / 3.28084 },
  },
  presets:     { metric: 'ms', imperial: 'fts' },
  defaultUnit: 'ms',
});

registerQuantity('groundSpeed', {
  units: {
    kn: { label: 'kn', fromSI: v => v, toSI: v => v },
  },
  presets:     { metric: 'kn', imperial: 'kn' },
  defaultUnit: 'kn',
});

registerQuantity('angle', {
  units: {
    deg: { label: '°', fromSI: v => v, toSI: v => v },
  },
  presets:     { metric: 'deg', imperial: 'deg' },
  defaultUnit: 'deg',
});

registerQuantity('salinity', {
  units: {
    psu: { label: 'PSU', fromSI: v => v, toSI: v => v },
  },
  presets:     { metric: 'psu', imperial: 'psu' },
  defaultUnit: 'psu',
});

registerQuantity('soundVelocity', {
  units: {
    ms: { label: 'm/s', fromSI: v => v, toSI: v => v },
  },
  presets:     { metric: 'ms', imperial: 'ms' },
  defaultUnit: 'ms',
});

registerQuantity('voltage', {
  units: {
    v: { label: 'V', fromSI: v => v, toSI: v => v },
  },
  presets:     { metric: 'v', imperial: 'v' },
  defaultUnit: 'v',
});

registerQuantity('current', {
  units: {
    a: { label: 'A', fromSI: v => v, toSI: v => v },
  },
  presets:     { metric: 'a', imperial: 'a' },
  defaultUnit: 'a',
});

registerQuantity('power', {
  units: {
    w: { label: 'W', fromSI: v => v, toSI: v => v },
  },
  presets:     { metric: 'w', imperial: 'w' },
  defaultUnit: 'w',
});

registerQuantity('percent', {
  units: {
    pct: { label: '%', fromSI: v => v, toSI: v => v },
  },
  presets:     { metric: 'pct', imperial: 'pct' },
  defaultUnit: 'pct',
});
