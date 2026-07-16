import React, { useMemo } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AlertCircle, ShieldCheck, Info } from "lucide-react";
import { calculateMER } from "@/lib/nutrition";

// ─── AAFCO 2016 minimums per 1,000 kcal ME ───
const AAFCO_PER_1000 = {
  protein_g: 45,
  fat_g: 13.8,
  calcium_g: 1.25,
  phosphorus_g: 1.0,
  potassium_g: 1.0,
  sodium_g: 0.2,
  chloride_g: 0.3,
  magnesium_g: 0.15,
  iron_mg: 10,
  copper_mg: 1.83,
  manganese_mg: 0.31,
  zinc_mg: 20,
  iodine_mg: 0.25,
  selenium_mg: 0.028,
  vitA_iu: 1250,
  vitD_iu: 125,
  vitE_iu: 12.5,
  thiamine_mg: 0.56,
  riboflavin_mg: 1.3,
  niacin_mg: 3.4,
  b6_mg: 0.38,
  b12_mg: 0.007,
  folicAcid_mg: 0.054,
  choline_mg: 340,
};

// ─── Estimated nutrient content of a balanced 70/10/10/10 fresh diet per 100g ───
// These are conservative estimates for a well-constructed rotation
const FRESH_DIET_PER_100G = {
  kcal: 120,
  protein_g: 19.5,      // high from muscle meat
  fat_g: 6.5,           // moderate from mixed cuts
  calcium_g: 0.08,      // low without bone — needs supplement
  phosphorus_g: 0.22,   // good from meat
  potassium_g: 0.32,
  sodium_g: 0.07,
  chloride_g: 0.12,
  magnesium_g: 0.02,
  iron_mg: 2.8,         // excellent from organ/red meat
  copper_mg: 0.35,      // from liver (5% of diet)
  manganese_mg: 0.04,
  zinc_mg: 4.0,
  iodine_mg: 0.003,     // low without kelp
  selenium_mg: 0.003,
  vitA_iu: 900,         // from liver/organ
  vitD_iu: 22,          // low in meat-only diets
  vitE_iu: 0.8,         // moderate from fat
  thiamine_mg: 0.12,
  riboflavin_mg: 0.22,
  niacin_mg: 4.5,
  b6_mg: 0.25,
  b12_mg: 0.002,
  folicAcid_mg: 0.012,
  choline_mg: 68,
};

// Bonus per constant (per meal, assuming 2x/day)
const CONSTANT_BONUS: Record<string, Partial<typeof AAFCO_PER_1000>> = {
  "Fish Oil":         { vitD_iu: 150, selenium_mg: 0.004 },
  "Kelp Powder":      { iodine_mg: 0.8 },
  "Raw Egg":          { vitD_iu: 80, choline_mg: 120, selenium_mg: 0.015, b12_mg: 0.002, riboflavin_mg: 0.25 },
  "Green-Lipped Mussel": { manganese_mg: 0.1, zinc_mg: 1.5 },
  "Nutritional Yeast": { thiamine_mg: 0.8, riboflavin_mg: 0.5, niacin_mg: 3.0, b6_mg: 0.5, b12_mg: 0.003, folicAcid_mg: 0.05 },
  "Turmeric":         {},
};

interface NutrientRow {
  label: string;
  unit: string;
  estimated: number;
  minimum: number;
  maximum?: number;
  status: "good" | "warn" | "low";
  note?: string;
}

function NutrientBar({ row }: { row: NutrientRow }) {
  const pct = Math.min(Math.round((row.estimated / row.minimum) * 100), 150);
  const barColor = row.status === "good" ? "bg-green-500" : row.status === "warn" ? "bg-amber-500" : "bg-red-400";
  const statusIcon = row.status === "good" ? "✅" : row.status === "warn" ? "⚠️" : "🔴";

  return (
    <div className="py-2 border-b border-border/30 last:border-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium">{statusIcon} {row.label}</span>
        <span className="text-xs text-muted-foreground">
          ~{row.estimated.toFixed(row.unit === 'IU' || row.estimated > 10 ? 0 : 3)} / {row.minimum}{row.unit}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 relative">
        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        {row.maximum && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 rounded" style={{ left: `${Math.min((row.maximum / row.minimum) * 66, 100)}%` }} />
        )}
      </div>
      {row.note && <p className="text-[10px] text-muted-foreground mt-0.5">{row.note}</p>}
    </div>
  );
}

export function NutritionPage() {
  const { activeDog } = useAppData();

  if (!activeDog || !activeDog.currentRotation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 text-muted-foreground">
        <Info className="w-12 h-12 opacity-30" />
        <p className="font-semibold">Set up a meal rotation in your profile to see nutrition analysis.</p>
      </div>
    );
  }

  const rot = activeDog.currentRotation;
  const dailyGrams = Math.round(rot.dailyKcal / 1.2); // ~1.2 kcal/g average fresh food

  // Scale AAFCO minimums to this dog's caloric needs
  const dailyKcal = rot.dailyKcal;
  const scale = dailyKcal / 1000;

  // Estimate nutrients from grams of food
  const gramsScale = dailyGrams / 100;
  const est: Record<string, number> = {};
  for (const [k, v] of Object.entries(FRESH_DIET_PER_100G)) {
    if (k !== 'kcal') est[k] = (v as number) * gramsScale;
  }

  // Add daily constants bonuses
  const todayMeal = rot.weeklyMeals[0];
  if (todayMeal?.constants) {
    for (const c of todayMeal.constants) {
      const bonus = CONSTANT_BONUS[c];
      if (bonus) {
        for (const [k, v] of Object.entries(bonus)) {
          est[k] = (est[k] || 0) + (v as number) * 2; // 2 meals/day
        }
      }
    }
  }

  const min = Object.fromEntries(
    Object.entries(AAFCO_PER_1000).map(([k, v]) => [k, (v as number) * scale])
  );

  const getNutrientRows = (): NutrientRow[] => [
    // Macros
    { label: "Protein", unit: "g", estimated: est.protein_g, minimum: min.protein_g, status: est.protein_g >= min.protein_g ? "good" : "warn" },
    { label: "Fat", unit: "g", estimated: est.fat_g, minimum: min.fat_g, status: est.fat_g >= min.fat_g ? "good" : "warn" },
    // Minerals
    { label: "Calcium", unit: "g", estimated: est.calcium_g, minimum: min.calcium_g, maximum: min.calcium_g * 2, status: est.calcium_g >= min.calcium_g ? "good" : "low", note: est.calcium_g < min.calcium_g ? "⚠️ Add raw bone, eggshell powder, or bone meal" : undefined },
    { label: "Phosphorus", unit: "g", estimated: est.phosphorus_g, minimum: min.phosphorus_g, status: est.phosphorus_g >= min.phosphorus_g ? "good" : "warn" },
    { label: "Potassium", unit: "g", estimated: est.potassium_g, minimum: min.potassium_g, status: est.potassium_g >= min.potassium_g ? "good" : "warn" },
    { label: "Magnesium", unit: "g", estimated: est.magnesium_g, minimum: min.magnesium_g, status: est.magnesium_g >= min.magnesium_g ? "good" : "warn" },
    { label: "Iron", unit: "mg", estimated: est.iron_mg, minimum: min.iron_mg, status: est.iron_mg >= min.iron_mg ? "good" : "warn" },
    { label: "Copper", unit: "mg", estimated: est.copper_mg, minimum: min.copper_mg, maximum: min.copper_mg * 5, status: est.copper_mg >= min.copper_mg ? (est.copper_mg > min.copper_mg * 4 ? "warn" : "good") : "warn", note: "Copper toxicity is a risk with excess liver" },
    { label: "Zinc", unit: "mg", estimated: est.zinc_mg, minimum: min.zinc_mg, status: est.zinc_mg >= min.zinc_mg ? "good" : "warn" },
    { label: "Manganese", unit: "mg", estimated: est.manganese_mg, minimum: min.manganese_mg, status: est.manganese_mg >= min.manganese_mg ? "good" : "warn" },
    { label: "Iodine", unit: "mg", estimated: est.iodine_mg, minimum: min.iodine_mg, status: est.iodine_mg >= min.iodine_mg ? "good" : "low", note: est.iodine_mg < min.iodine_mg ? "Add kelp powder daily" : undefined },
    { label: "Selenium", unit: "mg", estimated: est.selenium_mg, minimum: min.selenium_mg, status: est.selenium_mg >= min.selenium_mg ? "good" : "warn" },
    // Fat-Soluble Vitamins
    { label: "Vitamin A", unit: "IU", estimated: est.vitA_iu, minimum: min.vitA_iu, maximum: min.vitA_iu * 80, status: est.vitA_iu >= min.vitA_iu ? "good" : "warn", note: "Liver 3–5× per week usually covers this" },
    { label: "Vitamin D", unit: "IU", estimated: est.vitD_iu, minimum: min.vitD_iu, status: est.vitD_iu >= min.vitD_iu ? "good" : "low", note: est.vitD_iu < min.vitD_iu ? "Add fish oil + egg yolk. Consider Vit D3 supplement" : undefined },
    { label: "Vitamin E", unit: "IU", estimated: est.vitE_iu, minimum: min.vitE_iu, status: est.vitE_iu >= min.vitE_iu ? "good" : "warn", note: "Mixed tocopherols help prevent fat oxidation" },
    // B Vitamins
    { label: "Thiamine (B1)", unit: "mg", estimated: est.thiamine_mg, minimum: min.thiamine_mg, status: est.thiamine_mg >= min.thiamine_mg ? "good" : "warn" },
    { label: "Riboflavin (B2)", unit: "mg", estimated: est.riboflavin_mg, minimum: min.riboflavin_mg, status: est.riboflavin_mg >= min.riboflavin_mg ? "good" : "warn" },
    { label: "Niacin (B3)", unit: "mg", estimated: est.niacin_mg, minimum: min.niacin_mg, status: est.niacin_mg >= min.niacin_mg ? "good" : "warn" },
    { label: "Pyridoxine (B6)", unit: "mg", estimated: est.b6_mg, minimum: min.b6_mg, status: est.b6_mg >= min.b6_mg ? "good" : "warn" },
    { label: "Cobalamin (B12)", unit: "mg", estimated: est.b12_mg, minimum: min.b12_mg, status: est.b12_mg >= min.b12_mg ? "good" : "warn" },
    { label: "Folic Acid", unit: "mg", estimated: est.folicAcid_mg, minimum: min.folicAcid_mg, status: est.folicAcid_mg >= min.folicAcid_mg ? "good" : "warn" },
    { label: "Choline", unit: "mg", estimated: est.choline_mg, minimum: min.choline_mg, status: est.choline_mg >= min.choline_mg ? "good" : "warn" },
  ];

  const rows = getNutrientRows();
  const goodCount = rows.filter(r => r.status === 'good').length;
  const lowCount = rows.filter(r => r.status === 'low').length;
  const warnCount = rows.filter(r => r.status === 'warn').length;

  const macroData = [
    { name: "Muscle Meat", value: rot.breakdown.proteinPct },
    { name: "Organs", value: rot.breakdown.organPct },
    { name: "Vegetables", value: rot.breakdown.veggiePct },
    ...(rot.breakdown.starchPct > 0 ? [{ name: "Starches", value: rot.breakdown.starchPct }] : []),
  ];
  const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  const weightData = activeDog.weightLog.length > 0
    ? [...activeDog.weightLog].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(w => ({
        date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        kg: w.kg
      }))
    : [{ date: 'Today', kg: activeDog.weightKg }];

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-1">Nutrition Overview</h2>
        <p className="text-muted-foreground text-sm font-medium">Estimated analysis for {activeDog.name}'s current rotation.</p>
      </div>

      {/* COMPLIANCE SUMMARY */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-sm bg-green-50 dark:bg-green-950/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{goodCount}</div>
            <div className="text-xs text-muted-foreground font-medium">Met ✅</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{warnCount}</div>
            <div className="text-xs text-muted-foreground font-medium">Estimate ⚠️</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{lowCount}</div>
            <div className="text-xs text-muted-foreground font-medium">Low 🔴</div>
          </CardContent>
        </Card>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-2 px-1">Values are <em>estimates</em> based on typical ingredient averages. Actual nutrient levels vary by sourcing, cut, and freshness. Consult a veterinary nutritionist for precision.</p>

      {/* BOWL PROPORTIONS */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif">Bowl Proportions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={macroData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                  {macroData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v}%`, 'Proportion']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
            {macroData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs font-medium">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name} ({d.value}%)
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AAFCO NUTRIENT TRACKING */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-serif">AAFCO Nutrient Compliance</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Based on {dailyGrams}g/day ({dailyKcal} kcal) · AAFCO 2016 adult dog minimums</p>
        </CardHeader>
        <CardContent>
          {/* Group: Macros */}
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Macronutrients</div>
            {rows.slice(0, 2).map(r => <NutrientBar key={r.label} row={r} />)}
          </div>
          {/* Group: Minerals */}
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Minerals</div>
            {rows.slice(2, 12).map(r => <NutrientBar key={r.label} row={r} />)}
          </div>
          {/* Group: Vitamins */}
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Fat-Soluble Vitamins</div>
            {rows.slice(12, 15).map(r => <NutrientBar key={r.label} row={r} />)}
          </div>
          {/* Group: B Vitamins */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">B Vitamins & Choline</div>
            {rows.slice(15).map(r => <NutrientBar key={r.label} row={r} />)}
          </div>
        </CardContent>
      </Card>

      {/* KEY GAPS */}
      {lowCount > 0 && (
        <Card className="border-none shadow-sm bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <div className="font-bold text-sm text-red-700 dark:text-red-300">Nutrients Likely Below Minimum</div>
            </div>
            <div className="space-y-1">
              {rows.filter(r => r.status === 'low').map(r => (
                <div key={r.label} className="text-xs text-red-700 dark:text-red-300">
                  • <strong>{r.label}</strong>{r.note ? ` — ${r.note}` : ''}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WEIGHT HISTORY */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif">Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          {weightData.length > 1 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v} kg`, 'Weight']} />
                  <Line type="monotone" dataKey="kg" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg border border-dashed">
              Log more weight entries in Profile to see trends.
            </div>
          )}
        </CardContent>
      </Card>

      {/* CALORIE BREAKDOWN */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif">Daily Calorie Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Total MER Target</span>
            <span className="font-bold text-foreground">{rot.dailyKcal + rot.treatBudgetKcal} kcal</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Food Calories</span>
            <span className="font-bold text-foreground">{rot.dailyKcal} kcal</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Treat Budget (10%)</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{rot.treatBudgetKcal} kcal</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Per Meal (÷2)</span>
            <span className="font-bold text-primary">{Math.round(rot.dailyKcal / 2)} kcal · ~{Math.round(dailyGrams / 2)}g</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
