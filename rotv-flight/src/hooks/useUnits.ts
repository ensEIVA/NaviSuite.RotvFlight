import { useSettingsStore } from '../stores/useSettingsStore';
import { convert, backToSI, getLabel, resolveUnit } from '../utils/units';

export function useUnits() {
  const { unitPrefs } = useSettingsStore();

  return {
    fmt: (value: number, quantity: string) => {
      const unitKey = resolveUnit(quantity, unitPrefs);
      return { value: convert(value, quantity, unitKey), unit: getLabel(quantity, unitKey) };
    },
    toSI: (value: number, quantity: string) => {
      const unitKey = resolveUnit(quantity, unitPrefs);
      return backToSI(value, quantity, unitKey);
    },
    unitPrefs,
  };
}
