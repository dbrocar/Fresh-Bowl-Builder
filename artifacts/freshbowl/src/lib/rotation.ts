// ── 4-WEEK ROTATION PLAN ─────────────────────────────────────────────────────

export interface SlotMeal {
  protein: string;
  starch: string;
  veg: string;
  organ: string | null;
}

export interface DaySchedule {
  am: SlotMeal;
  pm: SlotMeal;
}

export type WeekNumber = 1 | 2 | 3 | 4;
export type DayAbbrev = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export const DAY_NAMES: DayAbbrev[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_FULL: Record<DayAbbrev, string> = {
  Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday"
};

export const STARCH_OPTIONS = ["Quinoa (cooked)", "Sweet Potato (cooked)", "Oats (cooked)", "White Rice (cooked)"];
export const VEG_OPTIONS = ["Green Beans", "Zucchini", "Bell Peppers", "Carrots", "Peas", "Spinach", "Romaine Lettuce", "Pumpkin (canned)"];
export const ORGAN_OPTIONS = ["Beef Liver", "Chicken Liver", "Beef Heart", "Chicken Heart", "Kidney"];

export interface ProteinEntry {
  name: string;
  emoji: string;
  category: "meat" | "fish";
}

export const PROTEIN_CATALOG: ProteinEntry[] = [
  { name: "Beef (85/15)",       emoji: "🥩", category: "meat" },
  { name: "Ground Turkey",       emoji: "🦃", category: "meat" },
  { name: "Ground Chicken",      emoji: "🍗", category: "meat" },
  { name: "Pork Loin",           emoji: "🥩", category: "meat" },
  { name: "Lamb",                emoji: "🐑", category: "meat" },
  { name: "Veal",                emoji: "🥩", category: "meat" },
  { name: "Bison",               emoji: "🦬", category: "meat" },
  { name: "Duck",                emoji: "🦆", category: "meat" },
  { name: "Sardines (canned)",   emoji: "🐟", category: "fish" },
  { name: "Salmon (canned)",     emoji: "🐟", category: "fish" },
];

// Default selected proteins for rotation (2 mains + 2 fish)
export const DEFAULT_SELECTED_PROTEINS = ["Beef (85/15)", "Ground Turkey", "Sardines (canned)", "Salmon (canned)"];

// ── WEEKS_BASE — 4-week rotation template ────────────────────────────────────
// Thu & Sun AM = fish/alt days. PM always uses the week's second main protein.
type WeeksBase = Record<WeekNumber, Record<DayAbbrev, DaySchedule>>;

function meal(protein: string, starch: string, veg: string, organ?: string | null): SlotMeal {
  return { protein, starch, veg, organ: organ ?? null };
}

export const WEEKS_BASE: WeeksBase = {
  1: {
    Sun: { am: meal("Sardines (canned)", "Quinoa (cooked)", "Green Beans"),           pm: meal("Beef (85/15)", "Quinoa (cooked)", "Carrots", "Beef Heart") },
    Mon: { am: meal("Beef (85/15)", "Quinoa (cooked)", "Green Beans", "Beef Heart"),  pm: meal("Ground Turkey", "Oats (cooked)", "Zucchini", "Chicken Liver") },
    Tue: { am: meal("Beef (85/15)", "Sweet Potato (cooked)", "Bell Peppers", "Beef Heart"), pm: meal("Ground Turkey", "Quinoa (cooked)", "Carrots", "Beef Liver") },
    Wed: { am: meal("Beef (85/15)", "Oats (cooked)", "Romaine Lettuce", "Beef Heart"), pm: meal("Ground Turkey", "Sweet Potato (cooked)", "Green Beans", "Chicken Liver") },
    Thu: { am: meal("Sardines (canned)", "Quinoa (cooked)", "Zucchini"),               pm: meal("Ground Turkey", "Oats (cooked)", "Bell Peppers", "Beef Liver") },
    Fri: { am: meal("Beef (85/15)", "Quinoa (cooked)", "Green Beans", "Beef Liver"),  pm: meal("Ground Turkey", "Sweet Potato (cooked)", "Carrots", "Chicken Liver") },
    Sat: { am: meal("Beef (85/15)", "Sweet Potato (cooked)", "Peas", "Beef Heart"),   pm: meal("Ground Turkey", "Quinoa (cooked)", "Romaine Lettuce", "Beef Liver") },
  },
  2: {
    Sun: { am: meal("Salmon (canned)", "Sweet Potato (cooked)", "Green Beans"),        pm: meal("Pork Loin", "Quinoa (cooked)", "Bell Peppers", "Beef Heart") },
    Mon: { am: meal("Pork Loin", "Quinoa (cooked)", "Zucchini", "Beef Heart"),         pm: meal("Ground Chicken", "Sweet Potato (cooked)", "Peas", "Beef Liver") },
    Tue: { am: meal("Pork Loin", "Oats (cooked)", "Bell Peppers", "Beef Liver"),       pm: meal("Ground Chicken", "Quinoa (cooked)", "Green Beans", "Chicken Liver") },
    Wed: { am: meal("Pork Loin", "Sweet Potato (cooked)", "Carrots", "Chicken Liver"), pm: meal("Ground Chicken", "Oats (cooked)", "Zucchini", "Beef Heart") },
    Thu: { am: meal("Salmon (canned)", "Quinoa (cooked)", "Green Beans"),              pm: meal("Ground Chicken", "Sweet Potato (cooked)", "Romaine Lettuce", "Beef Liver") },
    Fri: { am: meal("Pork Loin", "Quinoa (cooked)", "Peas", "Beef Heart"),             pm: meal("Ground Chicken", "Oats (cooked)", "Bell Peppers", "Chicken Liver") },
    Sat: { am: meal("Pork Loin", "Sweet Potato (cooked)", "Green Beans", "Beef Liver"), pm: meal("Ground Chicken", "Quinoa (cooked)", "Zucchini", "Beef Heart") },
  },
  3: {
    Sun: { am: meal("Sardines (canned)", "Quinoa (cooked)", "Peas"),                   pm: meal("Ground Turkey", "Sweet Potato (cooked)", "Green Beans", "Beef Heart") },
    Mon: { am: meal("Ground Turkey", "Quinoa (cooked)", "Bell Peppers", "Chicken Liver"), pm: meal("Beef (85/15)", "Sweet Potato (cooked)", "Green Beans", "Beef Heart") },
    Tue: { am: meal("Ground Turkey", "Oats (cooked)", "Romaine Lettuce", "Beef Liver"), pm: meal("Beef (85/15)", "Quinoa (cooked)", "Zucchini", "Chicken Liver") },
    Wed: { am: meal("Ground Turkey", "Sweet Potato (cooked)", "Carrots", "Beef Heart"), pm: meal("Beef (85/15)", "Oats (cooked)", "Bell Peppers", "Beef Liver") },
    Thu: { am: meal("Sardines (canned)", "Quinoa (cooked)", "Green Beans"),             pm: meal("Beef (85/15)", "Sweet Potato (cooked)", "Peas", "Chicken Liver") },
    Fri: { am: meal("Ground Turkey", "Oats (cooked)", "Zucchini", "Chicken Liver"),    pm: meal("Beef (85/15)", "Quinoa (cooked)", "Carrots", "Beef Heart") },
    Sat: { am: meal("Ground Turkey", "Sweet Potato (cooked)", "Peas", "Beef Liver"),   pm: meal("Beef (85/15)", "Quinoa (cooked)", "Romaine Lettuce", "Beef Heart") },
  },
  4: {
    Sun: { am: meal("Salmon (canned)", "Quinoa (cooked)", "Zucchini"),                  pm: meal("Ground Chicken", "Oats (cooked)", "Green Beans", "Beef Heart") },
    Mon: { am: meal("Ground Chicken", "Sweet Potato (cooked)", "Peas", "Beef Heart"),   pm: meal("Pork Loin", "Quinoa (cooked)", "Bell Peppers", "Beef Liver") },
    Tue: { am: meal("Ground Chicken", "Quinoa (cooked)", "Bell Peppers", "Chicken Liver"), pm: meal("Pork Loin", "Oats (cooked)", "Zucchini", "Beef Heart") },
    Wed: { am: meal("Ground Chicken", "Oats (cooked)", "Carrots", "Beef Liver"),        pm: meal("Pork Loin", "Sweet Potato (cooked)", "Green Beans", "Chicken Liver") },
    Thu: { am: meal("Salmon (canned)", "Sweet Potato (cooked)", "Peas"),                pm: meal("Pork Loin", "Quinoa (cooked)", "Romaine Lettuce", "Beef Heart") },
    Fri: { am: meal("Ground Chicken", "Quinoa (cooked)", "Green Beans", "Beef Heart"),  pm: meal("Pork Loin", "Oats (cooked)", "Bell Peppers", "Beef Liver") },
    Sat: { am: meal("Ground Chicken", "Sweet Potato (cooked)", "Zucchini", "Beef Liver"), pm: meal("Pork Loin", "Quinoa (cooked)", "Carrots", "Beef Heart") },
  },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Which week in the 4-week cycle (1–4) for a given date */
export function getWeekNumber(date: Date): WeekNumber {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const doy = Math.round((date.getTime() - jan1.getTime()) / 86400000);
  return ((Math.floor(doy / 7) % 4) + 1) as WeekNumber;
}

/** Day abbreviation for a date */
export function getDayAbbrev(date: Date): DayAbbrev {
  return DAY_NAMES[date.getDay()];
}

/** dateKey for localStorage: "YYYY-MM-DD" */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a dateKey back to a Date */
export function fromDateKey(ds: string): Date {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Get the scheduled meal for a specific date and slot */
export function getScheduledMeal(date: Date, slot: "am" | "pm"): SlotMeal | null {
  const wk = getWeekNumber(date);
  const dn = getDayAbbrev(date);
  const daySchedule = WEEKS_BASE[wk]?.[dn];
  if (!daySchedule) return null;
  return daySchedule[slot];
}

/** Get the full day schedule for a date */
export function getDaySchedule(date: Date): DaySchedule | null {
  const wk = getWeekNumber(date);
  const dn = getDayAbbrev(date);
  return WEEKS_BASE[wk]?.[dn] ?? null;
}

/** Today as a Date with no time component */
export function today(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Format a date as "Monday, Jul 16" */
export function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/** Format a date as "Jul 16" */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Add N days to a date */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
