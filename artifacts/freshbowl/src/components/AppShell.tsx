import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { HomePage } from "@/pages/HomePage";
import { RecipeBoxPage } from "@/pages/RecipeBox";
import { NutritionPage } from "@/pages/NutritionPage";
import { UtilitiesPage } from "@/pages/UtilitiesPage";
import { GuidePage } from "@/pages/GuidePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { useState } from "react";

export function AppShell() {
  const [view, setView] = useState<'home'|'recipebox'|'nutrition'|'utilities'|'guide'|'profile'>('home');

  return (
    <div className="min-h-[100dvh] w-full flex flex-col mx-auto max-w-[520px] bg-background shadow-xl shadow-black/5 relative pb-20">
      <Header setView={setView} />
      
      <main className="flex-1 overflow-x-hidden flex flex-col p-4 w-full">
        {view === 'home' && <HomePage setView={setView} />}
        {view === 'recipebox' && <RecipeBoxPage setView={setView} />}
        {view === 'nutrition' && <NutritionPage />}
        {view === 'utilities' && <UtilitiesPage />}
        {view === 'guide' && <GuidePage />}
        {view === 'profile' && <ProfilePage setView={setView} />}
      </main>

      {view !== 'profile' && <BottomNav view={view} setView={setView} />}
    </div>
  );
}
