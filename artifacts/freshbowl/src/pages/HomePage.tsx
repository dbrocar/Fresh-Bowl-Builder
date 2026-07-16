import React from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, RefreshCw, Calendar, Flame, Info, Sunrise, Moon } from "lucide-react";
import { getDaysDiff } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function HomePage({ setView }: { setView: (v: string) => void }) {
  const { activeDog } = useAppData();

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
      </div>
    );
  }

  const rotation = activeDog.currentRotation;
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayMeal = rotation?.weeklyMeals.find(m => m.day === todayName);
  const daysInRotation = rotation ? getDaysDiff(rotation.generatedAt, new Date().toISOString()) : 0;
  const totalVars = activeDog.favorites.proteins.length + activeDog.favorites.organs.length + activeDog.favorites.veggies.length;
  const aafcoOk = totalVars >= 5;

  const mealGrams = todayMeal ? Math.round(todayMeal.gramsTotal / 2) : 0;
  const mealKcal = todayMeal ? Math.round(todayMeal.kcal / 2) : 0;

  const MealCard = ({ label, icon: Icon, iconColor }: { label: string; icon: typeof Sunrise; iconColor: string }) => (
    <Card className="overflow-hidden border-none shadow-md shadow-primary/5 bg-card">
      <div className="bg-primary/10 px-4 py-3 flex justify-between items-center border-b border-primary/10">
        <h3 className="font-bold font-serif text-base flex items-center gap-2 text-foreground">
          <Icon className={cn("w-4 h-4", iconColor)} />
          {label}
        </h3>
        <div className="bg-background text-xs font-bold px-2.5 py-1 rounded-full text-foreground shadow-sm">
          ~{mealGrams}g · {mealKcal} kcal
        </div>
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          <div className="p-3.5 flex items-center gap-3 bg-card hover:bg-muted/30 transition-colors">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 text-base">🥩</div>
            <div className="min-w-0">
              <div className="font-semibold text-sm">{todayMeal?.protein ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Muscle Meat · {rotation?.breakdown.proteinPct ?? 70}% of bowl</div>
            </div>
          </div>
          <div className="p-3.5 flex items-center gap-3 bg-card hover:bg-muted/30 transition-colors">
            <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 text-base">🫀</div>
            <div className="min-w-0">
              <div className="font-semibold text-sm">{todayMeal?.organ ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Secreting Organ · {rotation?.breakdown.organPct ?? 10}% of bowl</div>
            </div>
          </div>
          <div className="p-3.5 flex items-center gap-3 bg-card hover:bg-muted/30 transition-colors">
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-base">🥦</div>
            <div className="min-w-0">
              <div className="font-semibold text-sm">{todayMeal?.veggie ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Vegetables · {rotation?.breakdown.veggiePct ?? 12}% of bowl</div>
            </div>
          </div>
          {todayMeal?.starch && (
            <div className="p-3.5 flex items-center gap-3 bg-card hover:bg-muted/30 transition-colors">
              <div className="w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0 text-base">🥔</div>
              <div className="min-w-0">
                <div className="font-semibold text-sm">{todayMeal.starch}</div>
                <div className="text-xs text-muted-foreground">Starch · {rotation?.breakdown.starchPct ?? 8}% of bowl</div>
              </div>
            </div>
          )}
          {todayMeal && todayMeal.constants.length > 0 && (
            <div className="p-3.5 bg-muted/20">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Daily Constants
              </div>
              <div className="flex flex-wrap gap-1.5">
                {todayMeal.constants.map((c, i) => (
                  <span key={i} className="bg-background border border-border px-2 py-0.5 rounded-md text-xs font-medium shadow-sm">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight mb-1 text-foreground">Hi, {activeDog.name} 🐾</h2>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        {rotation && (
          <div className="text-right">
            <div className="text-2xl font-bold text-primary tracking-tighter flex items-center justify-end gap-1">
              {rotation.dailyKcal} <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">kcal / day</div>
          </div>
        )}
      </div>

      {!rotation ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-3">
            <Info className="w-10 h-10 text-muted-foreground/50" />
            <div className="font-semibold text-foreground">No Meal Rotation Set</div>
            <p className="text-xs text-muted-foreground">Pick your dog's favorite ingredients to generate a balanced 7-day meal plan.</p>
            <Button onClick={() => setView('profile')} variant="default" size="sm" className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" /> Build Rotation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* AM Meal */}
          <MealCard label="🌅 Morning Bowl" icon={Sunrise} iconColor="text-amber-500" />

          {/* PM Meal */}
          <MealCard label="🌙 Evening Bowl" icon={Moon} iconColor="text-indigo-400" />

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-none shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground font-medium mb-1">Treat Budget</div>
                <div className="text-lg font-bold text-foreground">{rotation.treatBudgetKcal}</div>
                <div className="text-[10px] text-muted-foreground">kcal/day</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground font-medium mb-1">Per Meal</div>
                <div className="text-lg font-bold text-foreground">{mealGrams}g</div>
                <div className="text-[10px] text-muted-foreground">each bowl</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground font-medium mb-1">Balance</div>
                <div className={cn("text-sm font-bold", aafcoOk ? "text-green-600 dark:text-green-400" : "text-amber-500")}>
                  {aafcoOk ? "✅ Good" : "⚠️ Vary"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium bg-muted/50 rounded-lg p-3">
            <span>Day {daysInRotation + 1} of current rotation</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => setView('profile')}>
              Edit Plan <RefreshCw className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
