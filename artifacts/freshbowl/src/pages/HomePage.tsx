import React, { useState, useCallback } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sunrise, Moon, CheckCircle2, Circle, ChevronRight, Flame, Info, Footprints } from "lucide-react";
import { getDaySchedule, toDateKey, today, formatDateLong, PROTEIN_CATALOG, STARCH_OPTIONS, VEG_OPTIONS, ORGAN_OPTIONS, type SlotMeal } from "@/lib/rotation";
import { isFed, markFed, SUPP_NAMES, isSuppChecked, toggleSupp, getSwap, setSwap, getEffectiveMeal, type SwapType } from "@/lib/feedlog";
import { calculateMER } from "@/lib/nutrition";
import { computeMealAmounts, DEFAULT_AMOUNTS } from "@/lib/foods";
import { totalWalkStats, allTimeWalkStats } from "@/lib/care";
import { formatWeight, formatDistance } from "@/lib/settings";

const SWAP_OPTIONS: Record<SwapType, string[]> = {
  protein: PROTEIN_CATALOG.map(p => p.name),
  starch: STARCH_OPTIONS,
  veg: VEG_OPTIONS,
  organ: ORGAN_OPTIONS,
};

const SLOT_CONFIG = [
  { type: "protein" as SwapType, emoji: "🥩", label: "Protein" },
  { type: "starch" as SwapType, emoji: "🌾", label: "Starch" },
  { type: "veg" as SwapType, emoji: "🥦", label: "Veggie" },
  { type: "organ" as SwapType, emoji: "🫀", label: "Organ" },
];

interface SwapSheetProps {
  ds: string;
  slot: "am" | "pm";
  type: SwapType;
  current: string;
  onClose: () => void;
  onRefresh: () => void;
}

function SwapSheet({ ds, slot, type, current, onClose, onRefresh }: SwapSheetProps) {
  const options = SWAP_OPTIONS[type];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[520px] bg-background rounded-t-2xl p-5 pb-8 space-y-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <h3 className="font-serif font-bold text-lg text-foreground">Swap {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <p className="text-xs text-muted-foreground">Pick a replacement for this {slot.toUpperCase()} meal</p>
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                opt === current
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/70"
              )}
              onClick={() => {
                setSwap(ds, slot, type, opt === current ? null : opt);
                onRefresh();
                onClose();
              }}
            >
              {opt}
              {opt === current && <span className="ml-2 text-xs opacity-70">(current)</span>}
            </button>
          ))}
          {getSwap(ds, slot, type) && (
            <button
              className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => {
                setSwap(ds, slot, type, null);
                onRefresh();
                onClose();
              }}
            >
              ↩ Restore scheduled ingredient
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface MealCardProps {
  ds: string;
  slot: "am" | "pm";
  meal: SlotMeal | null;
  amounts: typeof DEFAULT_AMOUNTS;
  fed: boolean;
  onFedChange: (fed: boolean) => void;
  onRefresh: () => void;
}

function MealCard({ ds, slot, meal, amounts, fed, onFedChange, onRefresh }: MealCardProps) {
  const [swap, setSwapState] = useState<{ type: SwapType; current: string } | null>(null);
  const [showSupps, setShowSupps] = useState(false);
  const [suppTick, setSuppTick] = useState(0);

  const handleSupp = (supp: string, checked: boolean) => {
    toggleSupp(ds, slot, supp, checked);
    setSuppTick(t => t + 1);
  };

  if (!meal) {
    return (
      <Card className="border-none shadow-md bg-card">
        <div className="bg-muted/30 px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
          {slot === "am" ? <Sunrise className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          <span className="font-bold font-serif text-sm">{slot === "am" ? "Morning Bowl" : "Evening Bowl"}</span>
        </div>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          No meal scheduled — build your plan in Profile.
        </CardContent>
      </Card>
    );
  }

  const isAM = slot === "am";

  return (
    <>
      <Card className={cn(
        "border-none shadow-md transition-all duration-300",
        fed ? "shadow-green-500/10 ring-1 ring-green-500/20" : "bg-card"
      )}>
        <div className={cn(
          "px-4 py-2.5 flex justify-between items-center border-b",
          isAM ? "bg-amber-500/10 border-amber-500/10" : "bg-indigo-500/10 border-indigo-500/10"
        )}>
          <h3 className="font-bold font-serif text-sm flex items-center gap-2 text-foreground">
            {isAM ? <Sunrise className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            {isAM ? "Morning Bowl" : "Evening Bowl"}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              ~{(amounts.protein + amounts.starch + amounts.veg + amounts.organ).toFixed(1)} oz
            </span>
            <button
              onClick={() => { onFedChange(!fed); onRefresh(); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200",
                fed
                  ? "bg-green-500 text-white shadow-sm shadow-green-500/30"
                  : "bg-muted text-muted-foreground hover:bg-green-100 dark:hover:bg-green-900/20 hover:text-green-600"
              )}
            >
              {fed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
              {fed ? "Fed ✓" : "Mark Fed"}
            </button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {SLOT_CONFIG.map(({ type, emoji, label }) => {
              const value = meal[type === "organ" ? "organ" : type as keyof SlotMeal];
              if (!value) return null;
              const oz = amounts[type as keyof typeof amounts] ?? 0;
              const hasSwap = !!getSwap(ds, slot, type);
              return (
                <button
                  key={type}
                  className="w-full p-3 flex items-center gap-3 bg-card hover:bg-muted/30 transition-colors text-left active:scale-[0.99]"
                  onClick={() => setSwapState({ type, current: value as string })}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm">{emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("font-semibold text-sm truncate", hasSwap && "text-primary")}>{value as string}</div>
                    <div className="text-[10px] text-muted-foreground">{label} · {oz}oz</div>
                  </div>
                  {hasSwap && <span className="text-[9px] font-bold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wide">Swapped</span>}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                </button>
              );
            })}
          </div>

          <button
            className="w-full px-4 py-2.5 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground hover:bg-muted/20 transition-colors"
            onClick={() => setShowSupps(s => !s)}
          >
            <span className="font-semibold flex items-center gap-1.5">🧂 Daily Supplements</span>
            <span className={cn(
              "font-bold px-2 py-0.5 rounded-full text-[10px]",
              allSuppsCheckedLocal(ds, slot, suppTick)
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            )}>
              {countCheckedSupps(ds, slot, suppTick)}/{SUPP_NAMES.length} added
            </span>
          </button>

          {showSupps && (
            <div className="px-4 pb-3 space-y-1.5">
              {SUPP_NAMES.map(supp => (
                <label key={supp} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={isSuppChecked(ds, slot, supp)}
                    onChange={e => handleSupp(supp, e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm text-foreground">{supp}</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {swap && (
        <SwapSheet
          ds={ds}
          slot={slot}
          type={swap.type}
          current={swap.current}
          onClose={() => setSwapState(null)}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}

function allSuppsCheckedLocal(ds: string, slot: "am" | "pm", _tick: number) {
  return SUPP_NAMES.every(s => isSuppChecked(ds, slot, s));
}
function countCheckedSupps(ds: string, slot: "am" | "pm", _tick: number) {
  return SUPP_NAMES.filter(s => isSuppChecked(ds, slot, s)).length;
}

export function HomePage({ setView }: { setView: (v: string) => void }) {
  const { activeDog } = useAppData();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  const now = today();
  const ds = toDateKey(now);

  const scheduled = getDaySchedule(now);
  const amScheduled = scheduled?.am ?? null;
  const pmScheduled = scheduled?.pm ?? null;
  const amMeal = amScheduled ? getEffectiveMeal(ds, "am", amScheduled) : null;
  const pmMeal = pmScheduled ? getEffectiveMeal(ds, "pm", pmScheduled) : null;

  const amFed = isFed(ds, "am");
  const pmFed = isFed(ds, "pm");

  const mer = activeDog
    ? calculateMER(activeDog.weightKg, activeDog.activityLevel, activeDog.bodyCondition, activeDog.ageMonths, activeDog.neutered)
    : 0;
  const amounts = mer > 0 ? computeMealAmounts(mer) : DEFAULT_AMOUNTS;
  const walkStats = activeDog ? totalWalkStats(activeDog.id, 7) : { count: 0, miles: 0, minutes: 0 };
  const allTimeWalks = activeDog ? allTimeWalkStats(activeDog.id) : { count: 0, miles: 0, minutes: 0 };

  if (!activeDog) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">🐶</span>
        </div>
        <h2 className="text-2xl font-serif font-bold text-foreground">Welcome to FreshBowl</h2>
        <p className="text-muted-foreground text-sm">Add your dog to start planning healthy, balanced fresh meals.</p>
        <Button onClick={() => setView('profile')} size="lg" className="mt-4 font-bold tracking-wide">
          Set Up Profile
        </Button>
        <p className="text-xs text-muted-foreground max-w-xs">
          Once a dog is added, open <strong>Dog Profile</strong> to manage medications, vaccines, grooming, vet info, training, and walker sharing.
        </p>
      </div>
    );
  }

  const todayFormatted = formatDateLong(now);
  const bothFed = amFed && pmFed;

  return (
    <div className="space-y-4 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page title */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">Home</h1>
        <div className="text-xs text-muted-foreground font-medium">{todayFormatted}</div>
      </div>

      {bothFed && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div>
            <div className="font-bold text-sm text-green-700 dark:text-green-300">Both meals logged today! 🎉</div>
            <div className="text-[11px] text-muted-foreground">Great job keeping up with {activeDog.name}'s nutrition.</div>
          </div>
        </div>
      )}

      {/* Greeting + MER */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-serif font-bold tracking-tight text-foreground">
            Hi, {activeDog.name} 🐾
          </h2>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            {formatWeight(activeDog.weightKg)} · {activeDog.activityLevel} activity
          </p>
        </div>
        <div className="text-right">
          {mer > 0 && (
            <>
              <div className="text-xl font-bold text-primary flex items-center gap-1 justify-end">
                {mer} <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">kcal / day</div>
            </>
          )}
        </div>
      </div>

      {/* Meal stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card rounded-xl p-2.5 text-center border border-border/40 shadow-sm">
          <div className="text-lg font-bold text-foreground">{amounts.protein + amounts.starch + amounts.veg + amounts.organ}oz</div>
          <div className="text-[10px] text-muted-foreground font-medium">per meal</div>
        </div>
        <div className="bg-card rounded-xl p-2.5 text-center border border-border/40 shadow-sm">
          <div className={cn("text-lg font-bold", amFed ? "text-green-500" : "text-muted-foreground")}>
            {amFed ? "✓" : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground font-medium">AM fed</div>
        </div>
        <div className="bg-card rounded-xl p-2.5 text-center border border-border/40 shadow-sm">
          <div className={cn("text-lg font-bold", pmFed ? "text-green-500" : "text-muted-foreground")}>
            {pmFed ? "✓" : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground font-medium">PM fed</div>
        </div>
        <div className="bg-card rounded-xl p-2.5 text-center border border-border/40 shadow-sm">
          <div className="text-lg font-bold text-foreground">{walkStats.count}</div>
          <div className="text-[10px] text-muted-foreground font-medium">walks</div>
        </div>
      </div>

      {allTimeWalks.count > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Footprints className="w-4 h-4 text-blue-500" /> {activeDog.name}'s Walk Totals
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">all time</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 dark:bg-white/5 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatDistance(allTimeWalks.miles)}</div>
              <div className="text-[10px] text-muted-foreground font-medium">total distance</div>
            </div>
            <div className="bg-white/60 dark:bg-white/5 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{allTimeWalks.minutes}</div>
              <div className="text-[10px] text-muted-foreground font-medium">total minutes</div>
            </div>
          </div>
        </div>
      )}

      <MealCard
        key={`am-${tick}`}
        ds={ds}
        slot="am"
        meal={amMeal}
        amounts={amounts}
        fed={amFed}
        onFedChange={fed => markFed(ds, "am", fed)}
        onRefresh={refresh}
      />

      <MealCard
        key={`pm-${tick}`}
        ds={ds}
        slot="pm"
        meal={pmMeal}
        amounts={amounts}
        fed={pmFed}
        onFedChange={fed => markFed(ds, "pm", fed)}
        onRefresh={refresh}
      />

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setView('recipebox')}>
          📅 View Plan
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setView('nutrition')}>
          🥗 Nutrition
        </Button>
      </div>

      {/* Vet disclaimer - dark mode visible */}
      <div className="rounded-xl border border-border/40 bg-amber-500/10 dark:bg-amber-900/20 p-3.5 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/90 leading-relaxed">
          <strong className="text-amber-700 dark:text-amber-200">Important:</strong> The FRESHBOWL method is a whole-food planning tool, not a substitute for professional veterinary advice. Always consult your vet before changing medications, treating illness, or diagnosing conditions.
        </div>
      </div>
    </div>
  );
}
