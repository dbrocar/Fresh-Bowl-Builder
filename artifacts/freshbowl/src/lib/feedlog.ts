// ── FEEDING LOG (localStorage, separate from main profile) ───────────────────
// Keys:
//   fb_fed     → { [ds_slot]: boolean }          e.g. "2025-07-16_am": true
//   fb_swaps   → { [ds_slot_type]: string }       e.g. "2025-07-16_am_protein": "Duck"
//   fb_supps   → { [ds_slot_supp]: boolean }      e.g. "2025-07-16_am_eggshell": true
//   fb_notes   → { [ds]: string }                 e.g. "2025-07-16": "ate slowly today"
//   fb_amounts → { [ds_slot_type]: number }       e.g. "2025-07-16_am_protein": 7.5 (oz)

import { SlotMeal } from "./rotation";

// ── Fed log ──
export function loadFedLog(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem("fb_fed") ?? "{}"); } catch { return {}; }
}
export function saveFedLog(log: Record<string, boolean>) {
  localStorage.setItem("fb_fed", JSON.stringify(log));
}
export function isFed(ds: string, slot: "am" | "pm"): boolean {
  return !!loadFedLog()[`${ds}_${slot}`];
}
export function markFed(ds: string, slot: "am" | "pm", fed: boolean) {
  const log = loadFedLog();
  const key = `${ds}_${slot}`;
  if (fed) log[key] = true; else delete log[key];
  saveFedLog(log);
}

// ── Ingredient swaps ──
export type SwapType = "protein" | "starch" | "veg" | "organ";

export function loadSwaps(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem("fb_swaps") ?? "{}"); } catch { return {}; }
}
export function saveSwaps(swaps: Record<string, string>) {
  localStorage.setItem("fb_swaps", JSON.stringify(swaps));
}
export function getSwap(ds: string, slot: "am" | "pm", type: SwapType): string | null {
  const swaps = loadSwaps();
  return swaps[`${ds}_${slot}_${type}`] ?? null;
}
export function setSwap(ds: string, slot: "am" | "pm", type: SwapType, value: string | null) {
  const swaps = loadSwaps();
  const key = `${ds}_${slot}_${type}`;
  if (value) swaps[key] = value; else delete swaps[key];
  saveSwaps(swaps);
}

/** Apply any saved swaps to a scheduled meal */
export function getEffectiveMeal(ds: string, slot: "am" | "pm", scheduled: SlotMeal | null): SlotMeal | null {
  if (!scheduled) return null;
  const swaps = loadSwaps();
  return {
    protein: swaps[`${ds}_${slot}_protein`] ?? scheduled.protein,
    starch: swaps[`${ds}_${slot}_starch`] ?? scheduled.starch,
    veg: swaps[`${ds}_${slot}_veg`] ?? scheduled.veg,
    organ: swaps[`${ds}_${slot}_organ`] ?? scheduled.organ,
  };
}

// ── Supplement checks ──
export const SUPP_NAMES = ["Eggshell Powder", "Iodized Salt", "Psyllium Husk", "Herb Cube", "Broth"];

export function loadSuppChecks(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem("fb_supps") ?? "{}"); } catch { return {}; }
}
export function saveSuppChecks(checks: Record<string, boolean>) {
  localStorage.setItem("fb_supps", JSON.stringify(checks));
}
export function isSuppChecked(ds: string, slot: "am" | "pm", supp: string): boolean {
  const key = `${ds}_${slot}_${supp.replace(/\s+/g, "_").toLowerCase()}`;
  return !!loadSuppChecks()[key];
}
export function toggleSupp(ds: string, slot: "am" | "pm", supp: string, checked: boolean) {
  const key = `${ds}_${slot}_${supp.replace(/\s+/g, "_").toLowerCase()}`;
  const checks = loadSuppChecks();
  if (checked) checks[key] = true; else delete checks[key];
  saveSuppChecks(checks);
}
export function allSuppsChecked(ds: string, slot: "am" | "pm"): boolean {
  return SUPP_NAMES.every(s => isSuppChecked(ds, slot, s));
}

// ── Notes ──
export function loadNotes(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem("fb_notes") ?? "{}"); } catch { return {}; }
}
export function saveNotes(notes: Record<string, string>) {
  localStorage.setItem("fb_notes", JSON.stringify(notes));
}
export function getNote(ds: string): string {
  return loadNotes()[ds] ?? "";
}
export function setNote(ds: string, text: string) {
  const notes = loadNotes();
  if (text.trim()) notes[ds] = text; else delete notes[ds];
  saveNotes(notes);
}

// ── Amount overrides (oz) ──
export function loadAmounts(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem("fb_amounts") ?? "{}"); } catch { return {}; }
}
export function saveAmounts(amounts: Record<string, number>) {
  localStorage.setItem("fb_amounts", JSON.stringify(amounts));
}
export function getAmountOverride(ds: string, slot: "am" | "pm", type: string): number | null {
  const amounts = loadAmounts();
  const v = amounts[`${ds}_${slot}_${type}`];
  return v !== undefined ? v : null;
}
export function setAmountOverride(ds: string, slot: "am" | "pm", type: string, oz: number | null) {
  const amounts = loadAmounts();
  const key = `${ds}_${slot}_${type}`;
  if (oz !== null) amounts[key] = oz; else delete amounts[key];
  saveAmounts(amounts);
}

// ── Statistics helpers ──
/** Count how many meals were marked fed in the last N days */
export function countFedMeals(days: number): number {
  const log = loadFedLog();
  const today = new Date();
  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = toDateKeyLocal(d);
    if (log[`${ds}_am`]) count++;
    if (log[`${ds}_pm`]) count++;
  }
  return count;
}

function toDateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
