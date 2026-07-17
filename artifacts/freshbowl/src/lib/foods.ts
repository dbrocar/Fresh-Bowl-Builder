// ── FOODS DATABASE (per oz) ───────────────────────────────────────────────────
// All nutrient values are PER OZ of the ingredient.
// Units: protein/fat/carbs/moisture/ash = g; calcium through manganese = mg
// EXCEPT: iodine = mg, selenium = mcg, vitA/D/E = IU, vitK/vitB12/folate = mcg

export interface NutrientProfile {
  protein: number;    // g/oz
  fat: number;        // g/oz
  calcium: number;    // mg/oz
  phosphorus: number; // mg/oz
  potassium: number;  // mg/oz
  sodium: number;     // mg/oz
  chloride: number;   // mg/oz
  magnesium: number;  // mg/oz
  iron: number;       // mg/oz
  copper: number;     // mg/oz
  zinc: number;       // mg/oz
  iodine: number;     // mg/oz
  selenium: number;   // mcg/oz
  omega3: number;     // mg/oz
  omega6: number;     // mg/oz
  vitA: number;       // IU/oz
  vitD: number;       // IU/oz
  vitE: number;       // IU/oz
  vitK: number;       // mcg/oz
  vitB1: number;      // mg/oz (Thiamine)
  vitB2: number;      // mg/oz (Riboflavin)
  vitB3: number;      // mg/oz (Niacin)
  vitB5: number;      // mg/oz (Pantothenic acid)
  vitB6: number;      // mg/oz (Pyridoxine)
  vitB12: number;     // mcg/oz (Cobalamin)
  folate: number;     // mcg/oz
  choline: number;    // mg/oz
  manganese: number;  // mg/oz
  carbs: number;      // g/oz
  moisture: number;   // g/oz
  ash: number;        // g/oz
}

function mkN(
  pr: number, fa: number, ca: number, ph: number, po: number,
  so: number, cl: number, mg: number, fe: number, cu: number,
  zn: number, io: number, se: number, o3: number, o6: number,
  vA: number, vD: number, vE: number, vK: number,
  b1: number, b2: number, b3: number, b5: number, b6: number,
  b12: number, fo: number, ch: number, mn?: number
): NutrientProfile {
  return {
    protein: pr, fat: fa, calcium: ca, phosphorus: ph, potassium: po,
    sodium: so, chloride: cl, magnesium: mg, iron: fe, copper: cu,
    zinc: zn, iodine: io, selenium: se, omega3: o3, omega6: o6,
    vitA: vA, vitD: vD, vitE: vE, vitK: vK,
    vitB1: b1, vitB2: b2, vitB3: b3, vitB5: b5, vitB6: b6,
    vitB12: b12, folate: fo, choline: ch, manganese: mn ?? 0,
    carbs: 0, moisture: 0, ash: 0
  };
}

export const FOODS: Record<string, NutrientProfile> = {
  // ── Proteins
  "Beef (85/15)":      mkN(5.9,3.8,5,53,80,20,30,5,0.7,0.04,1.5,0.001,5,55,180,0,0.7,0.1,0,0.02,0.06,1.3,0.22,0.11,0.9,2,20),
  "Ground Turkey":     mkN(5.6,3.8,9,52,82,25,38,6,0.5,0.03,1.0,0.001,6,55,280,0,0.5,0.1,0,0.02,0.07,1.5,0.3,0.14,0.5,3,22),
  "Ground Chicken":    mkN(5.5,4.2,6,53,76,23,35,6,0.4,0.03,0.8,0.001,7,45,310,0,0.5,0.1,0,0.02,0.06,1.8,0.35,0.16,0.1,2,21),
  "Pork Loin":         mkN(6.0,1.0,5,60,82,20,30,7,0.3,0.03,1.0,0.001,8,30,120,0,1.2,0.1,0,0.20,0.08,1.5,0.35,0.15,0.3,1,18),
  "Sardines (canned)": mkN(5.8,3.2,115,90,95,110,160,9,0.6,0.04,0.8,0.01,12,550,130,27,50,0.3,0.5,0.01,0.07,1.2,0.2,0.04,3.2,3,20),
  "Salmon (canned)":   mkN(5.6,3.0,60,82,90,80,120,8,0.4,0.03,0.7,0.008,10,650,120,20,120,0.5,0.1,0.05,0.08,2.0,0.4,0.15,2.5,5,22),
  "Lamb":              mkN(5.7,4.5,4,58,78,20,30,6,0.6,0.06,1.4,0.001,9,45,150,0,0.6,0.1,0,0.04,0.15,1.5,0.25,0.13,0.6,4,24),
  "Veal":              mkN(6.1,1.5,3,62,84,22,33,7,0.3,0.03,1.1,0.001,7,35,90,0,0.4,0.1,0,0.03,0.10,1.8,0.30,0.14,0.4,3,20),
  "Bison":             mkN(6.2,1.2,3,60,90,20,30,6,0.9,0.05,1.6,0.001,6,40,90,0,0.3,0.1,0,0.03,0.12,1.6,0.20,0.15,0.5,3,22),
  "Duck":              mkN(5.3,4.8,4,50,70,22,33,5,0.7,0.08,0.6,0.001,6,60,150,0,0.5,0.1,0,0.08,0.10,1.5,0.35,0.10,0.5,3,25),
  // ── Organs
  "Beef Liver":        mkN(5.6,1.0,2,100,80,22,33,5,1.5,1.9,1.5,0.002,10,30,110,5000,12,0.3,1.5,0.1,0.8,3.5,1.7,0.25,25,80,120,0.09),
  "Chicken Liver":     mkN(5.3,1.2,3,95,73,26,39,5,2.5,0.9,1.2,0.002,15,40,150,3800,15,0.5,2.0,0.08,0.7,3.0,2.0,0.22,22,130,110,0.09),
  "Beef Heart":        mkN(5.5,2.0,3,70,80,22,33,5,1.0,0.2,1.2,0.001,5,35,90,5,0.5,0.2,0.2,0.08,0.3,2.5,0.6,0.1,4.5,3,35,0.06),
  "Chicken Heart":     mkN(5.4,2.6,3,68,75,24,36,5,1.8,0.25,1.3,0.001,8,30,140,10,0.4,0.3,0.2,0.1,0.5,3.5,1.0,0.15,6.0,35,60,0.06),
  "Kidney":            mkN(5.0,1.0,4,85,80,24,36,5,1.4,0.15,1.0,0.003,20,25,80,500,20,0.2,1.0,0.15,0.6,2.8,1.2,0.2,15,45,70,0.08),
  // ── Starches
  "Quinoa (cooked)":       mkN(1.1,0.5,10,28,50,3,5,12,0.4,0.06,0.4,0,1.5,10,50,0,0,0.1,0,0.04,0.02,0.2,0.1,0.05,0,20,5,0.17),
  "Sweet Potato (cooked)": mkN(0.5,0.0,8,13,90,3,5,5,0.2,0.02,0.1,0,0.2,5,15,380,0,0.1,0.5,0.03,0.02,0.2,0.2,0.08,0,3,6,0.07),
  "Oats (cooked)":         mkN(0.9,0.3,5,25,22,1,2,8,0.2,0.03,0.2,0,0.4,10,40,0,0,0.1,0,0.05,0.01,0.1,0.1,0.01,0,5,4,0.17),
  "White Rice (cooked)":   mkN(0.6,0.1,1,14,15,0,1,4,0.1,0.01,0.1,0,0.4,2,10,0,0,0.0,0,0.01,0.01,0.4,0.1,0.04,0,2,2,0.10),
  // ── Vegetables
  "Green Beans":       mkN(0.5,0.1,12,10,60,2,3,6,0.2,0.02,0.1,0,0.1,15,8,30,0,0.1,5,0.02,0.02,0.1,0.05,0.02,0,8,5),
  "Zucchini":          mkN(0.5,0.1,6,16,90,2,3,7,0.1,0.02,0.1,0,0.1,20,15,10,0,0.1,2,0.02,0.02,0.2,0.1,0.04,0,15,8),
  "Bell Peppers":      mkN(0.3,0.1,7,20,175,3,5,10,0.3,0.05,0.1,0,0.1,10,10,150,0,1.5,5,0.04,0.02,0.5,0.2,0.15,0,20,5),
  "Carrots":           mkN(0.3,0.0,9,10,80,16,24,4,0.1,0.01,0.1,0,0.1,5,10,440,0,0.2,2,0.02,0.02,0.2,0.1,0.04,0,5,5),
  "Peas":              mkN(1.4,0.1,8,23,90,2,3,8,0.4,0.04,0.3,0,0.2,20,20,15,0,0.1,5,0.06,0.03,0.5,0.1,0.04,0,25,10),
  "Spinach":           mkN(0.8,0.1,28,13,130,22,33,21,0.8,0.03,0.2,0,0.3,40,8,210,0,0.6,135,0.03,0.06,0.3,0.1,0.06,0,60,7),
  "Romaine Lettuce":   mkN(0.3,0.1,15,14,85,4,6,7,0.3,0.02,0.1,0,0.1,35,10,220,0,0.1,50,0.04,0.04,0.2,0.1,0.04,0,50,7),
  "Pumpkin (canned)":  mkN(0.3,0.1,7,9,50,1,2,3,0.2,0.01,0.1,0,0.1,5,5,450,0,0.6,2,0.01,0.02,0.1,0.1,0.02,0,4,5),
  // ── Extra / add-in items (Recipe Box extras)
  "Bone Broth":        mkN(0.2,0.0,3,5,30,10,15,1,0.05,0.01,0.05,0,0.05,0,0,0,0,0,0,0.01,0.01,0.05,0.01,0.01,0,1,2),
  "Fish Oil":          mkN(0,2.8,0,0,0,0,0,0,0,0,0,0,0,2700,180,0,0,3,0,0,0,0,0,0,0,0,0),
  "Hard Boiled Egg":   mkN(1.6,2.0,11,48,30,55,85,4,0.5,0.02,0.4,0.05,9,35,180,260,44,0.5,0.2,0.04,0.15,0.05,0.7,0.09,0.6,24,25,147),
  "Blueberries":       mkN(0.1,0.0,1,2,28,0,0,2,0.05,0.02,0.03,0,0.05,5,8,4,0,0.3,7.5,0.02,0.02,0.2,0.05,0.02,0,1,2),
};

// Carbs / Moisture / Ash per oz (g)
const FOOD_COMP: Record<string, [number, number, number]> = {
  "Beef (85/15)": [0,16.44,0.28], "Ground Turkey": [0,18.14,0.28], "Ground Chicken": [0,18.14,0.28],
  "Pork Loin": [0,17.86,0.28], "Sardines (canned)": [0,17.01,0.85], "Salmon (canned)": [0,18.43,0.71],
  "Lamb": [0,17.01,0.28], "Veal": [0,18.43,0.28], "Bison": [0,18.43,0.28], "Duck": [0,17.01,0.28],
  "Beef Liver": [1.13,19.85,0.43], "Chicken Liver": [0.28,19.85,0.43], "Beef Heart": [0.2,19.85,0.28],
  "Chicken Heart": [0.06,19.85,0.28], "Kidney": [0.09,21.26,0.37],
  "Quinoa (cooked)": [5.95,20.41,0.17], "Sweet Potato (cooked)": [5.95,21.83,0.23],
  "Oats (cooked)": [3.4,23.81,0.09], "White Rice (cooked)": [7.94,19.28,0.06],
  "Green Beans": [1.98,25.51,0.2], "Zucchini": [0.99,26.65,0.2], "Bell Peppers": [1.7,26.08,0.14],
  "Carrots": [2.84,24.95,0.26], "Peas": [3.97,22.4,0.26], "Spinach": [1.02,25.8,0.48],
  "Romaine Lettuce": [0.94,26.93,0.34], "Pumpkin (canned)": [2.27,25.51,0.23]
};
for (const name in FOOD_COMP) {
  if (FOODS[name]) {
    FOODS[name].carbs = FOOD_COMP[name][0];
    FOODS[name].moisture = FOOD_COMP[name][1];
    FOODS[name].ash = FOOD_COMP[name][2];
  }
}

// ── AAFCO 2016 minimums and maximums per 1,000 kcal ME (adult maintenance) ──
export interface AafcoTarget {
  k: keyof NutrientProfile;
  label: string;
  unit: string;
  min: number;
  max: number;
  group: string;
}

export const AAFCO: AafcoTarget[] = [
  { k:"protein",    label:"Protein",         unit:"g",   min:45.0,  max:999,   group:"Macros" },
  { k:"fat",        label:"Fat",             unit:"g",   min:13.8,  max:55,    group:"Macros" },
  { k:"calcium",    label:"Calcium",         unit:"mg",  min:1250,  max:2500,  group:"Minerals" },
  { k:"phosphorus", label:"Phosphorus",      unit:"mg",  min:1000,  max:4000,  group:"Minerals" },
  { k:"potassium",  label:"Potassium",       unit:"mg",  min:1378,  max:9999,  group:"Minerals" },
  { k:"sodium",     label:"Sodium",          unit:"mg",  min:200,   max:1500,  group:"Minerals" },
  { k:"chloride",   label:"Chloride",        unit:"mg",  min:300,   max:9999,  group:"Minerals" },
  { k:"magnesium",  label:"Magnesium",       unit:"mg",  min:150,   max:9999,  group:"Minerals" },
  { k:"iron",       label:"Iron",            unit:"mg",  min:10,    max:250,   group:"Minerals" },
  { k:"copper",     label:"Copper",          unit:"mg",  min:1.83,  max:25,    group:"Minerals" },
  { k:"zinc",       label:"Zinc",            unit:"mg",  min:15.0,  max:100,   group:"Minerals" },
  { k:"iodine",     label:"Iodine",          unit:"mg",  min:0.22,  max:2.75,  group:"Minerals" },
  { k:"selenium",   label:"Selenium",        unit:"mcg", min:87.5,  max:500,   group:"Minerals" },
  { k:"omega3",     label:"Omega-3",         unit:"mg",  min:110,   max:9999,  group:"Fatty Acids" },
  { k:"omega6",     label:"Omega-6",         unit:"mg",  min:2800,  max:9999,  group:"Fatty Acids" },
  { k:"vitA",       label:"Vitamin A",       unit:"IU",  min:1278,  max:50000, group:"Vitamins" },
  { k:"vitD",       label:"Vitamin D",       unit:"IU",  min:136,   max:1800,  group:"Vitamins" },
  { k:"vitE",       label:"Vitamin E",       unit:"IU",  min:11,    max:9999,  group:"Vitamins" },
  { k:"vitK",       label:"Vitamin K",       unit:"mcg", min:82,    max:9999,  group:"Vitamins" },
  { k:"vitB1",      label:"Thiamine B1",     unit:"mg",  min:0.56,  max:9999,  group:"Vitamins" },
  { k:"vitB2",      label:"Riboflavin B2",   unit:"mg",  min:1.3,   max:9999,  group:"Vitamins" },
  { k:"vitB3",      label:"Niacin B3",       unit:"mg",  min:4.25,  max:9999,  group:"Vitamins" },
  { k:"vitB5",      label:"Pantothenic B5",  unit:"mg",  min:4.0,   max:9999,  group:"Vitamins" },
  { k:"vitB6",      label:"Pyridoxine B6",   unit:"mg",  min:0.375, max:9999,  group:"Vitamins" },
  { k:"vitB12",     label:"Cobalamin B12",   unit:"mcg", min:9.0,   max:9999,  group:"Vitamins" },
  { k:"folate",     label:"Folate",          unit:"mcg", min:68,    max:9999,  group:"Vitamins" },
  { k:"choline",    label:"Choline",         unit:"mg",  min:425,   max:9999,  group:"Vitamins" },
  { k:"manganese",  label:"Manganese",       unit:"mg",  min:1.69,  max:9999,  group:"Minerals" },
];

// Supplement nutrient contribution per meal (eggshell, iodized salt, psyllium, herb cube, broth)
// Values match the original app's SUPPS constant
export const SUPPS_PER_MEAL: Partial<NutrientProfile> = {
  calcium: 800,   // mg — from eggshell powder
  sodium: 115,    // mg — from iodized salt
  chloride: 175,  // mg — from iodized salt
  iodine: 0.10,   // mg — from iodized salt
  vitE: 3.4,      // IU — from herb cube
};

// Default amounts per slot per meal (oz)
export const DEFAULT_AMOUNTS = {
  protein: 8,
  starch: 2.5,
  veg: 2.5,
  organ: 0.5,
  broth: 0.75,
};

// Total food oz per meal (excluding broth)
export const DEFAULT_FOOD_OZ = DEFAULT_AMOUNTS.protein + DEFAULT_AMOUNTS.starch + DEFAULT_AMOUNTS.veg + DEFAULT_AMOUNTS.organ;

// kcal per oz (derived from original: ~1350 kcal / 32 oz)
export const KCAL_PER_OZ = 42.2;

// Compute meal amounts in oz scaled to a dog's MER
export function computeMealAmounts(merKcal: number): typeof DEFAULT_AMOUNTS {
  const ozPerDay = merKcal / KCAL_PER_OZ;
  const ozPerMeal = ozPerDay / 2;
  const scale = ozPerMeal / DEFAULT_FOOD_OZ;
  return {
    protein: Math.round(DEFAULT_AMOUNTS.protein * scale * 10) / 10,
    starch: Math.round(DEFAULT_AMOUNTS.starch * scale * 10) / 10,
    veg: Math.round(DEFAULT_AMOUNTS.veg * scale * 10) / 10,
    organ: Math.round(DEFAULT_AMOUNTS.organ * scale * 10) / 10,
    broth: DEFAULT_AMOUNTS.broth,
  };
}

// Zero nutrient accumulator
export function zeroNutrients(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const a of AAFCO) result[a.k as string] = 0;
  result.carbs = 0;
  result.moisture = 0;
  result.ash = 0;
  return result;
}

// Add an ingredient to a running nutrient total
export function addFood(totals: Record<string, number>, ingredient: string, oz: number) {
  const profile = FOODS[ingredient];
  if (!profile || !oz) return;
  for (const key of Object.keys(profile) as (keyof NutrientProfile)[]) {
    const v = profile[key] as number;
    if (typeof v === 'number') {
      totals[key as string] = (totals[key as string] ?? 0) + v * oz;
    }
  }
}

// Add supplements (once per fed meal)
export function addSupps(totals: Record<string, number>) {
  for (const [k, v] of Object.entries(SUPPS_PER_MEAL)) {
    totals[k] = (totals[k] ?? 0) + (v ?? 0);
  }
}

// Estimate kcal for a nutrient total (Atwater factors: protein 3.5, fat 8.5, carbs 3.5)
export function calcKcalFromNutrients(totals: Record<string, number>): number {
  return (totals.protein ?? 0) * 3.5 + (totals.fat ?? 0) * 8.5 + (totals.carbs ?? 0) * 3.5;
}

// Compute AAFCO compliance for a set of totals over a period with totalKcal
export function aafcoCompliance(totals: Record<string, number>, totalKcal: number) {
  if (!totalKcal) return [];
  return AAFCO.map(a => {
    const actual = totals[a.k as string] ?? 0;
    const scaledMin = a.min * (totalKcal / 1000);
    const scaledMax = a.max < 9000 ? a.max * (totalKcal / 1000) : Infinity;
    const pct = scaledMin > 0 ? Math.min(actual / scaledMin, 2) : 1;
    return { ...a, actual, scaledMin, scaledMax, pct };
  });
}
