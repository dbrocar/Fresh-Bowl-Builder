import React from "react";
import { Home, ListOrdered, PieChart, Calculator, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  view: string;
  setView: (v: string) => void;
}

export function BottomNav({ view, setView }: BottomNavProps) {
  const navs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'recipebox', label: 'Recipe Box', icon: ListOrdered },
    { id: 'nutrition', label: 'Nutrition', icon: PieChart },
    { id: 'utilities', label: 'Utilities', icon: Calculator },
    { id: 'guide', label: 'Guide', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t border-border pb-safe">
      <div className="max-w-[520px] mx-auto flex justify-between px-2">
        {navs.map((n) => {
          const Icon = n.icon;
          const isActive = view === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full py-3 gap-1 transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                isActive ? "bg-primary/10" : ""
              )}>
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              </div>
              <span className="text-[10px] font-medium tracking-wide">{n.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
