import React, { useState } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Plus, ArrowLeftRight, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateActiveDog } from "@/lib/storage";

export function RecipeBoxPage({ setView }: { setView: (v: string) => void }) {
  const { activeDog, refresh } = useAppData();
  const [swapDay, setSwapDay] = useState<string | null>(null);
  
  if (!activeDog || !activeDog.currentRotation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
        <h2 className="text-2xl font-serif font-bold">Recipe Box</h2>
        <p className="text-muted-foreground text-sm">Build your rotation first to see weekly meals.</p>
        <Button onClick={() => setView('profile')}>Go to Profile</Button>
      </div>
    );
  }

  const rotation = activeDog.currentRotation;

  // Render weekly rotation
  return (
    <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">Weekly Plan</h2>
        <p className="text-muted-foreground text-sm font-medium">Rotation of your dog's favorites across 7 days. Tap any day to log a swap if you ran out of an ingredient.</p>
      </div>

      <div className="space-y-3">
        {rotation.weeklyMeals.map(meal => (
          <Card key={meal.day} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] overflow-hidden group" onClick={() => setSwapDay(meal.day)}>
            <div className="flex items-stretch h-full">
              <div className="bg-primary/10 w-12 flex items-center justify-center border-r border-primary/5 group-hover:bg-primary/20 transition-colors">
                <span className="font-bold font-serif text-primary-dark rotate-180" style={{ writingMode: 'vertical-rl' }}>{meal.day.substring(0,3)}</span>
              </div>
              <CardContent className="flex-1 p-3.5 py-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-2"><span className="text-lg">🥩</span> <span className="font-medium truncate">{meal.protein}</span></div>
                  <div className="flex items-center gap-2"><span className="text-lg">🫀</span> <span className="font-medium truncate">{meal.organ}</span></div>
                  <div className="flex items-center gap-2"><span className="text-lg">🥦</span> <span className="font-medium truncate">{meal.veggie}</span></div>
                  {meal.starch && <div className="flex items-center gap-2"><span className="text-lg">🥔</span> <span className="font-medium truncate">{meal.starch}</span></div>}
                </div>
              </CardContent>
              <div className="w-10 flex items-center justify-center text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Treat Tracker Widget */}
      <Card className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/40 dark:to-amber-900/20 border-orange-200 dark:border-orange-900/50">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold font-serif text-lg text-orange-900 dark:text-orange-200">Daily Treat Tracker</h3>
            <span className="bg-white dark:bg-black/50 text-orange-700 dark:text-orange-400 font-bold px-3 py-1 rounded-full text-sm shadow-sm">
              {rotation.treatBudgetKcal} kcal max
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-orange-800/80 dark:text-orange-300/80">Baby Carrot (4 kcal)</span>
              <Button variant="outline" size="sm" className="h-7 border-orange-300 text-orange-700 hover:bg-orange-200">Add +</Button>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-orange-800/80 dark:text-orange-300/80">Training Treat (3 kcal)</span>
              <Button variant="outline" size="sm" className="h-7 border-orange-300 text-orange-700 hover:bg-orange-200">Add +</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!swapDay} onOpenChange={(o) => !o && setSwapDay(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 min-h-[60vh]">
          <SheetTitle className="text-center font-serif text-xl mb-6">Swap Meal: {swapDay}</SheetTitle>
          <div className="text-center text-muted-foreground mb-6">
            <p>Select the category you want to swap for {swapDay}.</p>
            <p className="text-xs mt-2">Swap functionality coming soon...</p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setSwapDay(null)}>Close</Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
