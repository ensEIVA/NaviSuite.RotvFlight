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

/** Register a new quantity. Adding a quantity requires only this one call. */
export function registerQuantity(name: string, def: QuantityDef): void {
  registry[name] = def;
}

/** Expand a preset name (e.g. 'metric') into a full UnitPrefs map. */
export function applyPreset(preset: string): UnitPrefs {
  const prefs: UnitPrefs = {};
  for (const [name, def] of Object.entries(registry)) {
    prefs[name] = def.presets[preset] ?? def.defaultUnit;
  }
  return prefs;
}

/** Resolve the active unit key for a quantity given current prefs. */
export function resolveUnit(quantity: string, prefs: UnitPrefs): string {
  return prefs[quantity] ?? registry[quantity]?.defaultUnit ?? '';
}

/** Convert an SI value to display units. */
export function convert(value: number, quantity: string, unitKey: string): number {
  return registry[quantity]?.units[unitKey]?.fromSI(value) ?? value;
}

/** Convert a display-unit value back to SI for storage. */
export function backToSI(value: number, quantity: string, unitKey: string): number {
  return registry[quantity]?.units[unitKey]?.toSI(value) ?? value;
}

/** Return the unit label string for a quantity + unit key. */
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
