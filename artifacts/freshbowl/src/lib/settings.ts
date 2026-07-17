// ── Global app settings (stored outside the dog data) ───────────────────────────
export type WeightUnit = "kg" | "lb";
export type DistanceUnit = "mi" | "km";

export interface AppSettings {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
}

const SETTINGS_KEY = "fb_settings";

export const DEFAULT_SETTINGS: AppSettings = {
  weightUnit: "lb",
  distanceUnit: "mi",
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Partial<AppSettings>) {
  if (typeof window === "undefined") return;
  const updated = { ...loadSettings(), ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}

export function kgToLb(kg: number): number {
  return kg * 2.20462;
}

export function lbToKg(lb: number): number {
  return lb / 2.20462;
}

export function miToKm(mi: number): number {
  return mi * 1.60934;
}

export function kmToMi(km: number): number {
  return km / 1.60934;
}

export function formatWeight(kg: number, unit: WeightUnit = loadSettings().weightUnit): string {
  if (unit === "kg") return `${kg.toFixed(1)} kg`;
  return `${kgToLb(kg).toFixed(1)} lb`;
}

export function formatDistance(mi: number, unit: DistanceUnit = loadSettings().distanceUnit): string {
  if (unit === "km") return `${miToKm(mi).toFixed(2)} km`;
  return `${mi.toFixed(2)} mi`;
}
