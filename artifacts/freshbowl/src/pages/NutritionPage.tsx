import React, { useMemo, useState } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { Info, TrendingUp } from "lucide-react";
import { calculateMER } from "@/lib/nutrition";
import {
  FOODS, AAFCO, addFood, addSupps, calcKcalFromNutrients, aafcoCompliance, zeroNutrients,
  computeMealAmounts, DEFAULT_AMOUNTS
} from "@/lib/foods";
import { getWeekNumber, getDayAbbrev, WEEKS_BASE, toDateKey, today, addDays } from "@/lib/rotation";
import { isFed, getEffectiveMeal, loadFedLog } from "@/lib/feedlog";

type Period = "today" | "week" | "month";

function getDateRange(period: Period): Date[] {
  const now = today();
  if (period === "today") return [now];
  if (period === "week") {
    return Array.from({ length: 7 }, (_, i) => addDays(now, -6 + i));
  }
  return Array.from({ length: 30 }, (_, i) => addDays(now, -29 + i));
}

function toDS(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Compute real nutrient totals from the fed log + FOODS database
function computeNutrients(dates: Date[], amounts: typeof DEFAULT_AMOUNTS): {
  totals: Record<string, number>;
  kcal: number;
  fedMealCount: number;
} {
  const totals = zeroNutrients();
  let kcal = 0;
  let fedMealCount = 0;
  const fedLog = loadFedLog();

  for (const date of dates) {
    const ds = toDS(date);
    const wk = getWeekNumber(date);
    const dn = getDayAbbrev(date);
    const daySchedule = WEEKS_BASE[wk]?.[dn];
    if (!daySchedule) continue;

    for (const slot of ["am", "pm"] as const) {
      if (!fedLog[`${ds}_${slot}`]) continue;
      fedMealCount++;

      const meal = getEffectiveMeal(ds, slot, daySchedule[slot]);
      if (!meal) continue;

      // Add each food slot
      addFood(totals, meal.protein, amounts.protein);
      addFood(totals, meal.starch, amounts.starch);
      addFood(totals, meal.veg, amounts.veg);
      if (meal.organ) addFood(totals, meal.organ, amounts.organ);

      // Add supplement constants (eggshell, salt, etc.)
      addSupps(totals);
    }
  }

  kcal = calcKcalFromNutrients(totals);
  return { totals, kcal, fedMealCount };
}

// ── Donut colors ──
const MACRO_COLORS = ["#f59e0b", "#10b981", "#6366f1", "#94a3b8"];

// ── Compliance bar ──
function ComplianceBar({ label, unit, actual, scaledMin, scaledMax, pct, group }: {
  label: string; unit: string; actual: number; scaledMin: number; scaledMax: number; pct: number; group: string;
}) {
  const isOk = actual >= scaledMin;
  const isTooMuch = scaledMax < Infinity && actual > scaledMax;
  const barPct = Math.min(pct * 100, 100);
  const displayVal = actual < 10 ? actual.toFixed(2) : actual < 100 ? actual.toFixed(1) : Math.round(actual).toString();

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn("font-bold tabular-nums", isOk ? "text-green-600 dark:text-green-400" : "text-amber-500")}>
          {displayVal} <span className="font-normal text-muted-foreground">{unit}</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500",
            isTooMuch ? "bg-red-500" : isOk ? "bg-green-500" : "bg-amber-400")}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground flex justify-between">
        <span>Min: {scaledMin < 10 ? scaledMin.toFixed(2) : Math.round(scaledMin)} {unit}</span>
        {scaledMax < Infinity && <span>Max: {Math.round(scaledMax)} {unit}</span>}
      </div>
    </div>
  );
}

export function NutritionPage() {
  const { activeDog } = useAppData();
  const [period, setPeriod] = useState<Period>("week");
  const [activeGroup, setActiveGroup] = useState<string>("Macros");

  const mer = activeDog
    ? calculateMER(activeDog.weightKg, activeDog.activityLevel, activeDog.bodyCondition, activeDog.ageMonths, activeDog.neutered)
    : 0;
  const amounts = mer > 0 ? computeMealAmounts(mer) : DEFAULT_AMOUNTS;

  const dates = useMemo(() => getDateRange(period), [period]);
  const { totals, kcal, fedMealCount } = useMemo(() => computeNutrients(dates, amounts), [dates, amounts]);

  const compliance = useMemo(() => {
    if (!kcal) return [];
    return aafcoCompliance(totals, kcal);
  }, [totals, kcal]);

  // Macro donut data
  const macroData = [
    { name: "Protein", value: Math.round(totals.protein ?? 0) },
    { name: "Fat", value: Math.round(totals.fat ?? 0) },
    { name: "Carbs", value: Math.round(totals.carbs ?? 0) },
    { name: "Other", value: Math.round((totals.moisture ?? 0) * 0.1) },
  ].filter(d => d.value > 0);

  const groups = [...new Set(AAFCO.map(a => a.group))];
  const filteredCompliance = compliance.filter(c => c.group === activeGroup);

  const noData = fedMealCount === 0;

  if (!activeDog) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="text-4xl mb-4">🥗</div>
        <h2 className="text-xl font-serif font-bold">No Profile</h2>
        <p className="text-sm text-muted-foreground mt-2">Set up a dog profile to see nutrition tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground">Nutrition</h2>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">
          AAFCO 2016 adult maintenance · real nutrient tracking
        </p>
      </div>

      {/* Period selector */}
      <div className="grid grid-cols-3 gap-1.5 bg-muted/50 p-1 rounded-xl">
        {(["today", "week", "month"] as Period[]).map(p => (
          <button key={p}
            onClick={() => setPeriod(p)}
            className={cn("py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
              period === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {p === "today" ? "Today" : p === "week" ? "Last 7 Days" : "Last 30 Days"}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-foreground">{fedMealCount}</div>
            <div className="text-[10px] text-muted-foreground font-medium">meals logged</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-foreground">{Math.round(kcal)}</div>
            <div className="text-[10px] text-muted-foreground font-medium">total kcal</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <div className={cn("text-sm font-bold", compliance.filter(c => c.actual < c.scaledMin).length === 0 && fedMealCount > 0 ? "text-green-500" : "text-amber-500")}>
              {fedMealCount === 0 ? "—" : `${compliance.filter(c => c.actual >= c.scaledMin).length}/${AAFCO.length}`}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">AAFCO met</div>
          </CardContent>
        </Card>
      </div>

      {noData ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-3">
            <Info className="w-10 h-10 text-muted-foreground/30" />
            <div className="font-semibold text-foreground">No meals logged yet</div>
            <p className="text-xs text-muted-foreground max-w-xs">
              Tap <strong>Mark Fed</strong> on the Home tab after each meal. Nutrition tracking is calculated from your actual logged feedings using real food data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Macro Donut */}
          {macroData.length > 0 && (
            <Card className="border-none shadow-sm bg-card">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-bold">Macronutrient Composition</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" strokeWidth={0}>
                        {macroData.map((_, i) => (
                          <Cell key={i} fill={MACRO_COLORS[i % MACRO_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {macroData.map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MACRO_COLORS[i] }} />
                          {item.name}
                        </span>
                        <span className="font-bold tabular-nums">{item.value}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Group tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {groups.map(g => (
              <button key={g}
                onClick={() => setActiveGroup(g)}
                className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                  activeGroup === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                {g}
              </button>
            ))}
          </div>

          {/* AAFCO compliance bars */}
          <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 space-y-4">
              {filteredCompliance.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">No data for this group</div>
              )}
              {filteredCompliance.map(c => (
                <ComplianceBar key={c.k as string} {...c} />
              ))}
            </CardContent>
          </Card>

          {/* Note */}
          <div className="text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 leading-relaxed">
            <strong>AAFCO 2016 adult maintenance.</strong> Targets are scaled to actual kcal consumed ({Math.round(kcal)} kcal tracked). Nutrients are calculated from ingredient oz amounts + daily supplement constants (eggshell powder, iodized salt, psyllium husk, herb cube, broth). Tap Home → Mark Fed to log meals.
          </div>
        </>
      )}
    </div>
  );
}
