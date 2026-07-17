import React, { useMemo, useState, useRef, useEffect } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Info, ArrowLeft, ArrowRight } from "lucide-react";
import { calculateMER } from "@/lib/nutrition";
import { FOODS, AAFCO, addSupps, calcKcalFromNutrients, aafcoCompliance, zeroNutrients, computeMealAmounts, DEFAULT_AMOUNTS, SUPPS_PER_MEAL } from "@/lib/foods";
import { getWeekNumber, getDayAbbrev, WEEKS_BASE, toDateKey, today, addDays } from "@/lib/rotation";
import { isFed, getEffectiveMeal, loadFedLog, loadAddIns } from "@/lib/feedlog";

type Period = "today" | "week" | "month";

function getDateRange(period: Period): Date[] {
  const now = today();
  if (period === "today") return [now];
  if (period === "week") return Array.from({ length: 7 }, (_, i) => addDays(now, -6 + i));
  return Array.from({ length: 30 }, (_, i) => addDays(now, -29 + i));
}

function toDS(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface Contributor { name: string; amount: number; value: number; unit: string }

function computeNutrients(dates: Date[], amounts: typeof DEFAULT_AMOUNTS): {
  totals: Record<string, number>;
  kcal: number;
  fedMealCount: number;
  dailyTotals: { date: string; kcal: number; protein: number; fat: number }[];
  contributors: Record<string, Contributor[]>;
} {
  const totals = zeroNutrients();
  const contributors: Record<string, Contributor[]> = {};
  let kcal = 0;
  let fedMealCount = 0;
  const fedLog = loadFedLog();
  const dailyTotals: { date: string; kcal: number; protein: number; fat: number }[] = [];

  function addContributor(key: string, name: string, amount: number, value: number, unit: string) {
    if (!value) return;
    const list = contributors[key] || [];
    const existing = list.find(x => x.name === name);
    if (existing) { existing.amount += amount; existing.value += value; }
    else list.push({ name, amount, value, unit });
    contributors[key] = list;
  }

  for (const date of dates) {
    const ds = toDS(date);
    const wk = getWeekNumber(date);
    const dn = getDayAbbrev(date);
    const daySchedule = WEEKS_BASE[wk]?.[dn];
    if (!daySchedule) continue;
    let dayKcal = 0, dayProtein = 0, dayFat = 0;

    for (const slot of ["am", "pm"] as const) {
      if (!fedLog[`${ds}_${slot}`]) continue;
      fedMealCount++;
      const meal = getEffectiveMeal(ds, slot, daySchedule[slot]);
      if (!meal) continue;
      const ingredients: { name: string; oz: number }[] = [
        { name: meal.protein, oz: amounts.protein },
        { name: meal.starch, oz: amounts.starch },
        { name: meal.veg, oz: amounts.veg },
        ...(meal.organ ? [{ name: meal.organ, oz: amounts.organ }] : []),
      ];
      const addins = loadAddIns(ds, slot);
      for (const [item, oz] of Object.entries(addins)) ingredients.push({ name: item, oz });

      for (const { name, oz } of ingredients) {
        const profile = FOODS[name];
        if (!profile) continue;
        for (const key of Object.keys(profile) as (keyof typeof profile)[]) {
          const v = (profile[key] as number) * oz;
          if (v) {
            totals[key] = (totals[key] || 0) + v;
            addContributor(key, name, oz, v, key === "protein" || key === "fat" || key === "carbs" || key === "moisture" || key === "ash" ? "g" : "mg");
          }
        }
      }
      addSupps(totals);
      for (const [k, v] of Object.entries(SUPPS_PER_MEAL)) {
        if (v) addContributor(k, "Daily supplements", 1, v, "mg");
      }
      // per-day rough estimates
      dayProtein += (FOODS[meal.protein]?.protein || 0) * amounts.protein;
      dayFat += (FOODS[meal.protein]?.fat || 0) * amounts.protein;
    }
    dayKcal = dayProtein * 3.5 + dayFat * 8.5;
    dailyTotals.push({ date: ds, kcal: Math.round(dayKcal), protein: Math.round(dayProtein), fat: Math.round(dayFat) });
  }

  kcal = calcKcalFromNutrients(totals);
  return { totals, kcal, fedMealCount, dailyTotals, contributors };
}

function ComplianceBar({ label, unit, actual, scaledMin, scaledMax, pct, group, onClick }: {
  label: string; unit: string; actual: number; scaledMin: number; scaledMax: number; pct: number; group: string; onClick?: () => void;
}) {
  const isOk = actual >= scaledMin;
  const isTooMuch = scaledMax < Infinity && actual > scaledMax;
  const barPct = Math.min(pct * 100, 100);
  const displayVal = actual < 10 ? actual.toFixed(2) : actual < 100 ? actual.toFixed(1) : Math.round(actual).toString();
  return (
    <button onClick={onClick} className="w-full text-left space-y-1 group">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
        <span className={cn("font-bold tabular-nums", isOk ? "text-green-600 dark:text-green-400" : "text-amber-500")}>
          {displayVal} <span className="font-normal text-muted-foreground">{unit}</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", isTooMuch ? "bg-red-500" : isOk ? "bg-green-500" : "bg-amber-400")} style={{ width: `${barPct}%` }} />
      </div>
      <div className="text-[10px] text-muted-foreground flex justify-between">
        <span>Min: {scaledMin < 10 ? scaledMin.toFixed(2) : Math.round(scaledMin)} {unit}</span>
        {scaledMax < Infinity && <span>Max: {Math.round(scaledMax)} {unit}</span>}
      </div>
    </button>
  );
}

export function NutritionPage() {
  const { activeDog } = useAppData();
  const { theme } = useTheme();
  const [period, setPeriod] = useState<Period>("week");
  const [activeGroup, setActiveGroup] = useState<string>("Macros");
  const [dailyIdx, setDailyIdx] = useState(0);
  const isDark = theme === "dark";

  const mer = activeDog ? calculateMER(activeDog.weightKg, activeDog.activityLevel, activeDog.bodyCondition, activeDog.ageMonths, activeDog.neutered) : 0;
  const amounts = mer > 0 ? computeMealAmounts(mer) : DEFAULT_AMOUNTS;

  const dates = useMemo(() => getDateRange(period), [period]);
  const { totals, kcal, fedMealCount, dailyTotals, contributors } = useMemo(() => computeNutrients(dates, amounts), [dates, amounts]);
  const compliance = useMemo(() => aafcoCompliance(totals, kcal), [totals, kcal]);
  const [detail, setDetail] = useState<{ key: string; label: string; unit: string } | null>(null);

  // Dark-mode-aware chart colors
  const chartColors = isDark
    ? ["hsl(23, 54%, 54%)", "hsl(142, 55%, 38%)", "hsl(43, 74%, 60%)", "hsl(220, 20%, 55%)"]
    : ["hsl(23, 56%, 54%)", "hsl(142, 71%, 45%)", "hsl(43, 74%, 66%)", "hsl(215, 20%, 55%)"];

  const macroData = [
    { name: "Protein", key: "protein", value: Math.round(totals.protein ?? 0) },
    { name: "Fat", key: "fat", value: Math.round(totals.fat ?? 0) },
    { name: "Carbs", key: "carbs", value: Math.round(totals.carbs ?? 0) },
    { name: "Other", key: "moisture", value: Math.round((totals.moisture ?? 0) * 0.1) },
  ].filter(d => d.value > 0);

  const groups = [...new Set(AAFCO.map(a => a.group))];
  const filteredCompliance = compliance.filter(c => c.group === activeGroup);
  const noData = fedMealCount === 0;

  const daily = dailyTotals[dailyIdx] || dailyTotals[0];
  const showDaily = dailyTotals.length > 1;

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
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">Nutrition</h1>
        <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">AAFCO Tracking</span>
      </div>
      <p className="text-xs text-muted-foreground font-medium -mt-2">
        Real nutrient totals from logged meals using the FOODS database
      </p>

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

      <div className="grid grid-cols-3 gap-2">
        <Card className="border-none shadow-sm"><CardContent className="p-3 text-center"><div className="text-lg font-bold text-foreground">{fedMealCount}</div><div className="text-[10px] text-muted-foreground font-medium">meals logged</div></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-3 text-center"><div className="text-lg font-bold text-foreground">{Math.round(kcal)}</div><div className="text-[10px] text-muted-foreground font-medium">total kcal</div></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-3 text-center"><div className={cn("text-sm font-bold", compliance.filter(c => c.actual < c.scaledMin).length === 0 && fedMealCount > 0 ? "text-green-500" : "text-amber-500")}>{fedMealCount === 0 ? "—" : `${compliance.filter(c => c.actual >= c.scaledMin).length}/${AAFCO.length}`}</div><div className="text-[10px] text-muted-foreground font-medium">AAFCO met</div></CardContent></Card>
      </div>

      {noData ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-3">
            <Info className="w-10 h-10 text-muted-foreground/30" />
            <div className="font-semibold text-foreground">No meals logged yet</div>
            <p className="text-xs text-muted-foreground max-w-xs">Tap <strong>Mark Fed</strong> on the Home tab after each meal. Nutrition is calculated from real food data.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {showDaily && (
            <Card className="border-none shadow-sm bg-card">
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-bold">Daily Average</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <button disabled={dailyIdx <= 0} onClick={() => setDailyIdx(i => i - 1)} className="p-1 rounded-lg disabled:opacity-30 hover:bg-muted"><ArrowLeft className="w-4 h-4" /></button>
                  <div className="text-xs font-bold text-muted-foreground">{daily ? new Date(daily.date).toLocaleDateString() : "—"}</div>
                  <button disabled={dailyIdx >= dailyTotals.length - 1} onClick={() => setDailyIdx(i => i + 1)} className="p-1 rounded-lg disabled:opacity-30 hover:bg-muted"><ArrowRight className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted rounded-lg p-2 text-center"><div className="text-lg font-bold text-primary">{daily?.kcal || 0}</div><div className="text-[10px] text-muted-foreground">kcal</div></div>
                  <div className="bg-muted rounded-lg p-2 text-center"><div className="text-lg font-bold text-primary">{daily?.protein || 0}g</div><div className="text-[10px] text-muted-foreground">protein</div></div>
                  <div className="bg-muted rounded-lg p-2 text-center"><div className="text-lg font-bold text-primary">{daily?.fat || 0}g</div><div className="text-[10px] text-muted-foreground">fat</div></div>
                </div>
              </CardContent>
            </Card>
          )}

          {macroData.length > 0 && (
            <Card className="border-none shadow-sm bg-card">
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-bold">Macronutrient Composition</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" strokeWidth={0}>
                        {macroData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", color: "hsl(var(--foreground))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {macroData.map((item, i) => (
                      <button key={item.name} onClick={() => setDetail({ key: item.key, label: item.name, unit: "g" })} className="w-full flex items-center justify-between text-xs group">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: chartColors[i % chartColors.length] }} />{item.name}</span>
                        <span className="font-bold tabular-nums group-hover:text-primary transition-colors">{item.value}g</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {groups.map(g => (
              <button key={g} onClick={() => setActiveGroup(g)} className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap", activeGroup === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{g}</button>
            ))}
          </div>

          <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 space-y-4">
              {filteredCompliance.length === 0 && <div className="text-center text-sm text-muted-foreground py-4">No data for this group</div>}
              {filteredCompliance.map(c => <ComplianceBar key={c.k as string} {...c} onClick={() => setDetail({ key: c.k as string, label: c.label, unit: c.unit })} />)}</CardContent>
          </Card>

          <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
            <DialogContent className="max-w-sm rounded-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">{detail?.label} contributors</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 pt-2">
                {!detail || !contributors[detail.key]?.length ? (
                  <div className="text-sm text-muted-foreground text-center py-4">No contributor data available.</div>
                ) : (
                  contributors[detail.key].sort((a, b) => b.value - a.value).map((c, i) => (
                    <div key={i} className="flex justify-between items-center bg-muted/40 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.value.toFixed(1)} {c.unit} · {c.amount.toFixed(1)} oz</span>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 leading-relaxed">
            <strong>AAFCO 2016 adult maintenance.</strong> Targets scaled to actual kcal consumed ({Math.round(kcal)} kcal tracked). Totals include ingredient oz amounts + daily supplements (eggshell powder, iodized salt, psyllium husk, herb cube, broth).
          </div>
        </>
      )}
    </div>
  );
}
