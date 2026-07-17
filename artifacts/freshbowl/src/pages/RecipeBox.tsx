import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, Plus, X, ChevronDown, ChevronUp, Minus } from "lucide-react";
import {
  WEEKS_BASE, DAY_NAMES, toDateKey, today, fromDateKey, addDays,
  formatDateLong, formatDateShort, getWeekNumber, getDayAbbrev, type WeekNumber, type SlotMeal
} from "@/lib/rotation";
import { isFed, getNote, setNote, markFed, getEffectiveMeal, getSwap, setSwap, type SwapType } from "@/lib/feedlog";
import { STARCH_OPTIONS, VEG_OPTIONS, ORGAN_OPTIONS, PROTEIN_CATALOG } from "@/lib/rotation";

// ── Add-in categories ──
const ADDIN_CATEGORIES = [
  { id: "protein", label: "Protein Add-ins", options: PROTEIN_CATALOG.map(p => p.name), icon: "🥩" },
  { id: "starch",  label: "Starch Add-ins",  options: STARCH_OPTIONS, icon: "🌾" },
  { id: "veg",     label: "Veggie Add-ins",  options: VEG_OPTIONS, icon: "🥦" },
  { id: "organ",   label: "Organ Add-ins",   options: ORGAN_OPTIONS, icon: "🫀" },
  { id: "extra",   label: "Extra Items",       options: ["Bone Broth", "Fish Oil", "Hard Boiled Egg", "Blueberries", "Pumpkin (canned)"], icon: "✨" },
];

interface AddInState {
  category: string;
  item: string;
  oz: number;
}

function toDS(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateFromDS(ds: string): Date {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ── Swap modal ──
const SWAP_OPTIONS: Record<string, string[]> = {
  protein: PROTEIN_CATALOG.map(p => p.name),
  starch: STARCH_OPTIONS,
  veg: VEG_OPTIONS,
  organ: ORGAN_OPTIONS,
};

function SwapModal({ ds, slot, type, current, onClose, onDone }: {
  ds: string; slot: "am" | "pm"; type: string; current: string;
  onClose: () => void; onDone: () => void;
}) {
  const options = SWAP_OPTIONS[type] ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[520px] mx-auto bg-background rounded-t-2xl p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <h3 className="font-serif font-bold text-base mb-3">Swap {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {options.map(opt => (
            <button key={opt}
              className={cn("w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                opt === current ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70")}
              onClick={() => { setSwap(ds, slot, type as SwapType, opt === current ? null : opt); onDone(); onClose(); }}>
              {opt}
            </button>
          ))}
          {getSwap(ds, slot, type as SwapType) && (
            <button className="w-full text-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg"
              onClick={() => { setSwap(ds, slot, type as SwapType, null); onDone(); onClose(); }}>
              ↩ Restore scheduled
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add-in modal for a meal slot ──
function AddInModal({ ds, slot, onClose, onRefresh }: { ds: string; slot: "am" | "pm"; onClose: () => void; onRefresh: () => void }) {
  const [addins, setAddins] = useState<AddInState[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>("extra");

  const addItem = (category: string, item: string) => {
    if (addins.find(a => a.category === category && a.item === item)) return;
    setAddins([...addins, { category, item, oz: 0.5 }]);
  };

  const removeItem = (category: string, item: string) => {
    setAddins(addins.filter(a => !(a.category === category && a.item === item)));
  };

  const updateOz = (category: string, item: string, oz: number) => {
    setAddins(addins.map(a => a.category === category && a.item === item ? { ...a, oz: Math.max(0.1, Math.round(oz * 10) / 10) } : a));
  };

  const save = () => {
    // Store in localStorage under fb_addins_{ds}_{slot}
    const key = `fb_addins_${ds}_${slot}`;
    const data: Record<string, number> = {};
    addins.forEach(a => { if (a.oz > 0) data[a.item] = a.oz; });
    if (Object.keys(data).length) localStorage.setItem(key, JSON.stringify(data)); else localStorage.removeItem(key);
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[520px] mx-auto bg-background rounded-t-2xl p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <h3 className="font-serif font-bold text-base mb-1">Add Items</h3>
        <p className="text-xs text-muted-foreground mb-3">{formatDateLong(dateFromDS(ds))} · {slot.toUpperCase()} meal</p>

        {/* Expandable categories - larger/indented */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto mb-4">
          {ADDIN_CATEGORIES.map(cat => (
            <div key={cat.id} className="border border-border/40 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
                onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-bold text-sm">{cat.label}</span>
                </div>
                {expandedCat === cat.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedCat === cat.id && (
                <div className="px-2 pb-2 pt-1 space-y-1">
                  {cat.options.map(opt => {
                    const added = addins.find(a => a.category === cat.id && a.item === opt);
                    return (
                      <div key={opt} className="flex items-center justify-between pl-6 pr-2 py-1.5">
                        <span className="text-sm">{opt}</span>
                        {added ? (
                          <div className="flex items-center gap-2">
                            <button className="w-6 h-6 rounded bg-muted flex items-center justify-center" onClick={() => updateOz(cat.id, opt, added.oz - 0.25)}><Minus className="w-3 h-3" /></button>
                            <span className="text-sm font-bold w-12 text-center">{added.oz}oz</span>
                            <button className="w-6 h-6 rounded bg-muted flex items-center justify-center" onClick={() => updateOz(cat.id, opt, added.oz + 0.25)}><Plus className="w-3 h-3" /></button>
                            <button className="ml-1 text-destructive" onClick={() => removeItem(cat.id, opt)}><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold" onClick={() => addItem(cat.id, opt)}>Add</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button className="w-full" onClick={save}>Save Add-ins</Button>
      </div>
    </div>
  );
}

// ── Day Detail Modal ──
function DayDetailModal({ ds, onClose, onRefresh }: { ds: string; onClose: () => void; onRefresh: () => void }) {
  const date = dateFromDS(ds);
  const wk = getWeekNumber(date);
  const dn = getDayAbbrev(date);
  const schedule = WEEKS_BASE[wk]?.[dn];
  const [swap, setSwapState] = useState<{ slot: "am" | "pm"; type: string; current: string } | null>(null);
  const [addInSlot, setAddInSlot] = useState<"am" | "pm" | null>(null);
  const [note, setNoteState] = useState(getNote(ds));
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  const amFed = isFed(ds, "am");
  const pmFed = isFed(ds, "pm");
  const amMeal = schedule ? getEffectiveMeal(ds, "am", schedule.am) : null;
  const pmMeal = schedule ? getEffectiveMeal(ds, "pm", schedule.pm) : null;

  const getAddins = (slot: "am" | "pm") => {
    try { return JSON.parse(localStorage.getItem(`fb_addins_${ds}_${slot}`) || "{}"); } catch { return {}; }
  };

  const SlotRow = ({ slot, meal, fed }: { slot: "am" | "pm"; meal: SlotMeal | null; fed: boolean }) => {
    const addins = getAddins(slot);
    const hasAddins = Object.keys(addins).length > 0;
    return (
      <div className={cn("rounded-xl p-3 border", fed ? "border-green-500/30 bg-green-500/5" : "border-border/40 bg-muted/20")}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm">{slot === "am" ? "🌅 Morning" : "🌙 Evening"}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setAddInSlot(slot)} className="text-xs font-medium text-primary hover:underline">+ Items</button>
            <button
              onClick={() => { markFed(ds, slot, !fed); refresh(); onRefresh(); }}
              className={cn("text-xs font-bold px-2.5 py-1 rounded-full transition-colors",
                fed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-green-100 dark:hover:bg-green-900/20")}
            >
              {fed ? "✓ Fed" : "Mark Fed"}
            </button>
          </div>
        </div>
        {meal ? (
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {["protein", "starch", "veg", "organ"].map(type => {
              const val = meal[type as keyof SlotMeal];
              if (!val) return null;
              const hasSwap = !!getSwap(ds, slot, type as SwapType);
              return (
                <button key={type}
                  className={cn("text-left px-2 py-1.5 rounded-md transition-colors",
                    hasSwap ? "bg-primary/10 text-primary" : "bg-background hover:bg-muted")}
                  onClick={() => setSwapState({ slot, type, current: val as string })}>
                  <div className="font-semibold truncate">{val as string}</div>
                  <div className="text-muted-foreground capitalize">{type} {hasSwap && "·↔"}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No meal scheduled</div>
        )}
        {hasAddins && (
          <div className="mt-2 text-xs text-muted-foreground bg-background/50 rounded-lg px-2 py-1.5">
            <strong>Added:</strong> {Object.entries(addins).map(([item, oz]) => `${item} ${oz}oz`).join(", ")}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-end" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-[520px] mx-auto bg-background rounded-t-2xl p-5 pb-8 max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
          onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
          <h3 className="font-serif font-bold text-base mb-4">{formatDateLong(date)}</h3>
          <div className="space-y-3 mb-4">
            <SlotRow slot="am" meal={amMeal} fed={amFed} />
            <SlotRow slot="pm" meal={pmMeal} fed={pmFed} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Day Notes</label>
            <textarea
              value={note}
              onChange={e => setNoteState(e.target.value)}
              placeholder="Add a note for this day..."
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm resize-none h-20 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button size="sm" className="w-full" onClick={() => { setNote(ds, note); onClose(); onRefresh(); }}>Save Note</Button>
          </div>
        </div>
      </div>
      {swap && (
        <SwapModal
          ds={ds} slot={swap.slot} type={swap.type} current={swap.current}
          onClose={() => setSwapState(null)} onDone={() => { refresh(); onRefresh(); }}
        />
      )}
      {addInSlot && (
        <AddInModal ds={ds} slot={addInSlot} onClose={() => setAddInSlot(null)} onRefresh={() => { refresh(); onRefresh(); }} />
      )}
    </>
  );
}

// ── Month Calendar ──
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function MonthCalendar({ onDayClick }: { onDayClick: (ds: string) => void }) {
  const now = today();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const firstDOW = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDS = toDS(now);

  const navMonth = (dir: number) => {
    const d = new Date(year, month + dir, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => navMonth(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        <span className="font-serif font-bold text-sm">{MONTH_NAMES[month]} {year}</span>
        <button onClick={() => navMonth(1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDOW }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const ds = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const amFed = isFed(ds, "am");
          const pmFed = isFed(ds, "pm");
          const hasNote = !!getNote(ds);
          const isToday = ds === todayDS;
          const fedCount = (amFed ? 1 : 0) + (pmFed ? 1 : 0);
          return (
            <button key={d}
              onClick={() => onDayClick(ds)}
              className={cn(
                "relative flex flex-col items-center py-1 rounded-lg transition-colors text-[11px] font-medium",
                isToday ? "bg-primary text-primary-foreground" : fedCount === 2 ? "bg-green-500/15 text-foreground" : fedCount === 1 ? "bg-amber-500/15 text-foreground" : "hover:bg-muted text-foreground"
              )}>
              <span>{d}</span>
              <div className="flex gap-0.5 mt-0.5">
                <span className={cn("w-1 h-1 rounded-full", amFed ? "bg-green-500" : "bg-border/60")} />
                <span className={cn("w-1 h-1 rounded-full", pmFed ? "bg-indigo-400" : "bg-border/60")} />
              </div>
              {hasNote && <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-400" />}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500/50" />Both fed</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/50" />1 of 2</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Note</span>
      </div>
    </div>
  );
}

// ── Rotation Plan View ──
const WEEK_COLORS: Record<WeekNumber, string> = {
  1: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  2: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  3: "text-green-600 dark:text-green-400 bg-green-500/10",
  4: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
};

function RotationPlan() {
  const [activeWeek, setActiveWeek] = useState<WeekNumber>(getWeekNumber(today()));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1.5 bg-muted/50 p-1 rounded-xl">
        {([1, 2, 3, 4] as WeekNumber[]).map(wk => (
          <button key={wk}
            onClick={() => setActiveWeek(wk)}
            className={cn("py-1.5 rounded-lg text-xs font-bold transition-all",
              activeWeek === wk ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            Week {wk}
            {wk === getWeekNumber(today()) && <span className="ml-1 text-primary">·</span>}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {DAY_NAMES.map(dn => {
          const daySchedule = WEEKS_BASE[activeWeek]?.[dn];
          if (!daySchedule) return null;
          const isAltDay = dn === "Thu" || dn === "Sun";
          return (
            <Card key={dn} className="border-none shadow-sm bg-card overflow-hidden">
              <div className="flex">
                <div className={cn("w-14 flex items-center justify-center border-r border-border/30 shrink-0", WEEK_COLORS[activeWeek])}>
                  <span className="font-bold font-serif text-sm">{dn}</span>
                </div>
                <div className="flex-1 divide-y divide-border/30">
                  <div className="px-3 py-2">
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1">🌅 AM</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      <span className={cn("font-semibold", isAltDay && "text-blue-500 dark:text-blue-400")}>🥩 {daySchedule.am.protein}</span>
                      <span className="text-muted-foreground">🌾 {daySchedule.am.starch}</span>
                      <span className="text-muted-foreground">🥦 {daySchedule.am.veg}</span>
                      {daySchedule.am.organ && <span className="text-muted-foreground">🫀 {daySchedule.am.organ}</span>}
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1">🌙 PM</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      <span className="font-semibold">🥩 {daySchedule.pm.protein}</span>
                      <span className="text-muted-foreground">🌾 {daySchedule.pm.starch}</span>
                      <span className="text-muted-foreground">🥦 {daySchedule.pm.veg}</span>
                      {daySchedule.pm.organ && <span className="text-muted-foreground">🫀 {daySchedule.pm.organ}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        🐟 Thursday &amp; Sunday AM = fish day (Sardines or Salmon for omega-3). Week cycle resets every 4 weeks.
      </div>
    </div>
  );
}

export function RecipeBoxPage({ setView }: { setView: (v: string) => void }) {
  const [subView, setSubView] = useState<"rotation" | "calendar">("rotation");
  const [dayModal, setDayModal] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  return (
    <div className="space-y-4 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">Feeding Schedule</h1>
        <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">4-Week Rotation</span>
      </div>
      <p className="text-xs text-muted-foreground font-medium -mt-2">
        Whole-food rotation · Thu &amp; Sun are fish days · Tap any day to swap ingredients or add extras
      </p>

      <div className="grid grid-cols-2 gap-1.5 bg-muted/50 p-1 rounded-xl">
        <button
          onClick={() => setSubView("rotation")}
          className={cn("flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
            subView === "rotation" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
          <LayoutGrid className="w-3.5 h-3.5" /> Rotation Plan
        </button>
        <button
          onClick={() => setSubView("calendar")}
          className={cn("flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
            subView === "calendar" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
          <CalendarDays className="w-3.5 h-3.5" /> Feeding Calendar
        </button>
      </div>

      {subView === "rotation" ? <RotationPlan /> : (
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-4"><MonthCalendar onDayClick={setDayModal} /></CardContent>
        </Card>
      )}

      {dayModal && <DayDetailModal key={dayModal + tick} ds={dayModal} onClose={() => setDayModal(null)} onRefresh={refresh} />}
    </div>
  );
}
