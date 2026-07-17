import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { saveCalculationForActiveDog } from "@/lib/storage";
import { calculateMER } from "@/lib/nutrition";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MapPin, Clock, Play, Square, Pause, Footprints, Lock, Shield, Calendar, Activity } from "lucide-react";
import { getDaySchedule, toDateKey, today, formatDateLong } from "@/lib/rotation";
import { isFed, markFed } from "@/lib/feedlog";
import { saveWalk, getWalks, deleteWalk, totalWalkStats, haversineMiles, getWalkerSession, storeWalkerSession, clearWalkerSession, validateSharedAccess } from "@/lib/care";
import type { Walk } from "@/lib/care";
import { WalkMap } from "@/components/WalkMap";

function stopProp(e: React.PointerEvent | React.MouseEvent | React.TouchEvent) {
  e.stopPropagation();
}

function SavePrompt({ label, onSave, onDismiss }: { label: string; onSave: () => void; onDismiss: () => void }) {
  return (
    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
      <p className="text-sm font-semibold text-foreground mb-2">📝 {label}</p>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={onSave}>✅ Yes, save</Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onDismiss}>Skip</Button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  WALK TRACKER (geolocation)
// ══════════════════════════════════════════════════════════
function WalkTracker() {
  const { activeDog } = useAppData();
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [points, setPoints] = useState<{ lat: number; lng: number; ts: number }[]>([]);
  const [walks, setWalks] = useState<Walk[]>([]);
  const [showRecent, setShowRecent] = useState(true);
  const watchId = useRef<number | null>(null);
  const startTime = useRef<string>("");
  const lastPoint = useRef<{ lat: number; lng: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseElapsed = useRef(0);

  const reload = useCallback(() => {
    if (activeDog) setWalks(getWalks(activeDog.id));
  }, [activeDog]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTracking, isPaused]);

  const start = () => {
    if (!navigator.geolocation) { toast({ title: "GPS not supported", variant: "destructive" }); return; }
    if (!activeDog) { toast({ title: "No active dog", variant: "destructive" }); return; }
    setIsTracking(true); setIsPaused(false); setElapsed(0); setDistance(0); setPoints([]);
    lastPoint.current = null; startTime.current = new Date().toISOString(); pauseElapsed.current = 0;

    navigator.geolocation.getCurrentPosition(pos => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
      setPoints([p]); lastPoint.current = p;
    });

    watchId.current = navigator.geolocation.watchPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
        setPoints(prev => {
          const last = prev[prev.length - 1];
          if (last) {
            const d = haversineMiles(last.lat, last.lng, p.lat, p.lng);
            if (d > 0.001) {
              setDistance(dist => dist + d);
              return [...prev, p];
            }
          }
          return prev.length ? prev : [p];
        });
        lastPoint.current = p;
      },
      err => { toast({ title: "GPS error", description: err.message, variant: "destructive" }); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  };

  const pause = () => { setIsPaused(true); if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); watchId.current = null; };
  const resume = () => { setIsPaused(false); start(); };
  const stop = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setIsTracking(false); setIsPaused(false);
    const walk: Walk = {
      id: crypto.randomUUID(),
      dogId: activeDog!.id,
      date: new Date().toISOString().split("T")[0],
      startTime: startTime.current,
      endTime: new Date().toISOString(),
      durationSec: elapsed,
      distanceMiles: distance,
      distanceKm: Math.round(distance * 1.60934 * 100) / 100,
      points,
    };
    saveWalk(walk);
    reload();
    toast({ title: `Walk saved! ${distance.toFixed(2)} mi · ${formatTime(elapsed)}` });
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return `${h ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const stats = activeDog ? totalWalkStats(activeDog.id, 7) : { count: 0, miles: 0, minutes: 0 };

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200 dark:border-green-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Footprints className="w-5 h-5 text-green-600" /> Walk Tracker
        </CardTitle>
        <p className="text-sm text-muted-foreground">GPS-based walk logging with distance and time.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background/70 dark:bg-background/30 rounded-xl p-2 text-center">
            <div className="text-xl font-bold text-foreground">{stats.count}</div>
            <div className="text-[10px] text-muted-foreground">7d walks</div>
          </div>
          <div className="bg-background/70 dark:bg-background/30 rounded-xl p-2 text-center">
            <div className="text-xl font-bold text-foreground">{stats.miles}</div>
            <div className="text-[10px] text-muted-foreground">miles</div>
          </div>
          <div className="bg-background/70 dark:bg-background/30 rounded-xl p-2 text-center">
            <div className="text-xl font-bold text-foreground">{stats.minutes}</div>
            <div className="text-[10px] text-muted-foreground">minutes</div>
          </div>
        </div>

        {/* Big timer display */}
        <div className="bg-background/80 dark:bg-background/40 rounded-2xl p-6 text-center border border-green-200/50 dark:border-green-800/50">
          <div className="text-5xl font-bold tabular-nums text-foreground tracking-tight">{formatTime(elapsed)}</div>
          <div className="text-sm text-muted-foreground mt-1">{distance.toFixed(2)} miles · {points.length} GPS points</div>
          {isPaused && <div className="text-xs font-bold text-amber-500 mt-2">Paused</div>}
        </div>

        {/* Controls */}
        {!isTracking ? (
          <Button className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white" onClick={start}>
            <Play className="w-5 h-5 mr-2" /> Start Walk
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {!isPaused ? (
              <Button variant="outline" className="h-14 text-base font-bold" onClick={pause}><Pause className="w-4 h-4 mr-2" /> Pause</Button>
            ) : (
              <Button className="h-14 text-base font-bold bg-green-600 hover:bg-green-700 text-white" onClick={resume}><Play className="w-4 h-4 mr-2" /> Resume</Button>
            )}
            <Button variant="destructive" className="h-14 text-base font-bold" onClick={stop}><Square className="w-4 h-4 mr-2" /> Stop & Save</Button>
          </div>
        )}

        {!activeDog && <div className="text-xs text-center text-muted-foreground">Select a dog in the header to start tracking.</div>}

        {/* Live route preview */}
        {isTracking && points.length > 1 && (
          <WalkMap points={points} height="220px" />
        )}

        {/* Recent walks */}
        {walks.length > 0 && (
          <div className="space-y-2">
            <button className="text-xs font-bold text-primary flex items-center gap-1" onClick={() => setShowRecent(s => !s)}>
              {showRecent ? "Hide" : "Show"} recent walks
            </button>
            {showRecent && walks.slice().reverse().slice(0, 5).map(w => (
              <div key={w.id} className="space-y-2">
                <div className="flex justify-between items-center bg-background/60 dark:bg-background/30 rounded-lg px-3 py-2 text-sm">
                  <div>
                    <div className="font-bold">{new Date(w.startTime).toLocaleDateString()} · {formatTime(w.durationSec)}</div>
                    <div className="text-xs text-muted-foreground">{w.distanceMiles.toFixed(2)} mi</div>
                  </div>
                  <button className="text-destructive text-xs" onClick={() => { if (activeDog) deleteWalk(w.id, activeDog.id); reload(); }}>Delete</button>
                </div>
                {w.points.length > 1 && <WalkMap points={w.points} height="160px" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════
//  DOG WALKER LOGIN (limited shared access)
// ══════════════════════════════════════════════════════════
function WalkerLogin() {
  const { data, activeDog, refresh } = useAppData();
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [session, setSession] = useState(getWalkerSession());
  const [canFeed, setCanFeed] = useState(false);
  const [canWalk, setCanWalk] = useState(false);
  const [canView, setCanView] = useState(false);

  const login = () => {
    if (!activeDog) return;
    const access = validateSharedAccess(activeDog.id, pin);
    if (!access) { toast({ title: "Invalid PIN", variant: "destructive" }); return; }
    storeWalkerSession(activeDog.id, pin);
    setSession({ dogId: activeDog.id, pin });
    setCanFeed(access.canLogFeeding);
    setCanWalk(access.canLogWalks);
    setCanView(access.canViewProfile);
    toast({ title: `Walker mode: ${access.name}` });
  };

  const logout = () => { clearWalkerSession(); setSession(null); setPin(""); setCanFeed(false); setCanWalk(false); setCanView(false); };

  const todayDS = toDateKey(today());
  const schedule = activeDog ? getDaySchedule(today()) : null;
  const amFed = activeDog ? isFed(todayDS, "am") : false;
  const pmFed = activeDog ? isFed(todayDS, "pm") : false;

  if (session) {
    return (
      <Card className="border-none shadow-sm border-blue-200 dark:border-blue-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-serif flex items-center gap-2"><Shield className="w-5 h-5 text-blue-500" /> Walker Mode</CardTitle>
          <p className="text-sm text-muted-foreground">Limited access. You can only view what the owner shared.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {canView && schedule && (
            <div className="bg-muted/40 rounded-xl p-3 text-sm space-y-2">
              <div className="font-bold">Today's Schedule</div>
              <div>AM: {schedule.am.protein} {amFed && "✓"}</div>
              <div>PM: {schedule.pm.protein} {pmFed && "✓"}</div>
            </div>
          )}
          {canFeed && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant={amFed ? "default" : "outline"} onClick={() => { markFed(todayDS, "am", !amFed); refresh(); }} className="text-xs">AM {amFed ? "Fed ✓" : "Mark Fed"}</Button>
              <Button variant={pmFed ? "default" : "outline"} onClick={() => { markFed(todayDS, "pm", !pmFed); refresh(); }} className="text-xs">PM {pmFed ? "Fed ✓" : "Mark Fed"}</Button>
            </div>
          )}
          {canWalk && <div className="text-xs text-green-600 dark:text-green-400 font-bold">You can also use the Walk Tracker above.</div>}
          <Button variant="outline" className="w-full" onClick={logout}><Lock className="w-4 h-4 mr-2" /> Exit Walker Mode</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Dog Walker Login</CardTitle>
        <p className="text-sm text-muted-foreground">Enter the PIN the owner created in Dog Profile → Share.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} />
        <Button className="w-full" onClick={login} disabled={!activeDog || pin.length < 4}>Enter Walker Mode</Button>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════
//  EXISTING CALCULATORS (kept for compatibility)
// ══════════════════════════════════════════════════════════
function RRCalculator() {
  const { activeDog, refresh } = useAppData();
  const { toast } = useToast();
  const [windowSec, setWindowSec] = useState("30");
  const [taps, setTaps] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ bpm: number; status: string; detail: string } | null>(null);
  const [showSave, setShowSave] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const win = parseInt(windowSec) || 30;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          if (e + 1 >= win) { clearInterval(intervalRef.current!); setRunning(false); return win; }
          return e + 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, win]);

  useEffect(() => {
    if (!running && elapsed === win && elapsed > 0) {
      const bpm = Math.round((taps / win) * 60);
      let status = "normal", detail = "✅ Normal resting rate (< 30 BPM). Great!";
      if (bpm >= 40) { status = "high"; detail = "🚨 Elevated — contact your vet, especially if your dog has a heart condition."; }
      else if (bpm >= 30) { status = "borderline"; detail = "⚠️ Borderline — re-measure in a cool quiet room. Consult vet if sustained."; }
      setResult({ bpm, status, detail });
      setShowSave(!!activeDog);
    }
  }, [running, elapsed, win]);

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!running && elapsed === 0) { setTaps(1); setElapsed(0); setRunning(true); setResult(null); setShowSave(false); }
    else if (running) { setTaps(t => t + 1); if (navigator.vibrate) navigator.vibrate(10); }
  };
  const reset = (e: React.MouseEvent) => { e.stopPropagation(); clearInterval(intervalRef.current!); setRunning(false); setTaps(0); setElapsed(0); setResult(null); setShowSave(false); };
  const handleSave = () => { if (!result) return; saveCalculationForActiveDog('rr', `${result.bpm} BPM (${win}s window)`, { bpm: result.bpm, taps, window: win, status: result.status }); refresh(); setShowSave(false); toast({ title: `Saved to ${activeDog?.name}'s profile ✅` }); };
  const bpmColor = result ? (result.status === 'normal' ? 'text-green-600 dark:text-green-400' : result.status === 'borderline' ? 'text-amber-500' : 'text-red-600 dark:text-red-400') : '';

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-lg font-serif">💨 Resting Respiratory Rate</CardTitle><p className="text-sm text-muted-foreground">Tap once per breath while your dog sleeps. Normal: &lt;30 BPM.</p></CardHeader>
      <CardContent className="space-y-4" onPointerDown={stopProp} onClick={stopProp}>
        <div className="space-y-2"><Label>Counting Window</Label><Select value={windowSec} onValueChange={v => { setWindowSec(v); reset({ stopPropagation: () => {} } as any); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15">15 seconds</SelectItem><SelectItem value="30">30 seconds (recommended)</SelectItem><SelectItem value="60">60 seconds</SelectItem></SelectContent></Select></div>
        <button onClick={handleTap} className={`w-full py-8 rounded-xl text-xl font-bold text-white transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none select-none touch-manipulation ${running ? 'bg-green-500' : 'bg-primary'}`}>{!running && elapsed === 0 ? '👆 Tap to Start & Count Breaths' : running ? `👆 Tap Each Breath (${taps})` : '✅ Done'}</button>
        <div className="flex justify-between text-sm font-medium bg-muted p-3 rounded-lg"><span>⏱️ {elapsed}s / {win}s</span><span>Taps: {taps}</span><button onClick={reset} className="text-muted-foreground hover:text-foreground text-xs underline">Reset</button></div>
        {result && <div className={`p-4 rounded-lg border-l-4 ${result.status === 'normal' ? 'bg-green-50 dark:bg-green-950/30 border-green-500' : result.status === 'borderline' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500' : 'bg-red-50 dark:bg-red-950/30 border-red-500'}`}><div className={`font-bold text-2xl mb-1 ${bpmColor}`}>{result.bpm} BPM</div><div className="text-sm">{result.detail}</div></div>}
        {showSave && result && <SavePrompt label={`Save this reading to ${activeDog?.name}'s profile?`} onSave={handleSave} onDismiss={() => setShowSave(false)} />}
      </CardContent>
    </Card>
  );
}

function CaloriesCalculator() {
  const { activeDog, refresh } = useAppData();
  const { toast } = useToast();
  const [weight, setWeight] = useState(activeDog?.weightKg?.toString() || "25");
  const [age, setAge] = useState("adult");
  const [activity, setActivity] = useState("1.6");
  const [condition, setCondition] = useState("1.0");
  const [meals, setMeals] = useState("2");
  const [treatPct, setTreatPct] = useState("10");
  const [result, setResult] = useState<{ mer: number; rer: number; foodKcal: number; treatKcal: number; ozPerDay: number; ozPerMeal: number; mealsCount: number } | null>(null);
  const [showSave, setShowSave] = useState(false);

  const calc = (e: React.MouseEvent) => {
    e.stopPropagation();
    const w = parseFloat(weight) || 25; const actF = parseFloat(activity) || 1.6; const condF = parseFloat(condition) || 1.0; const mealsN = parseInt(meals) || 2; const treatF = parseFloat(treatPct) / 100;
    let ageFactor = 1.0; if (age === 'puppy_under4') ageFactor = 3.0; else if (age === 'puppy_4to12') ageFactor = 2.0; else if (age === 'senior') ageFactor = 0.9;
    const rer = 70 * Math.pow(w, 0.75); const mer = rer * actF * condF * ageFactor;
    const treatKcal = Math.round(mer * treatF); const foodKcal = Math.round(mer - treatKcal);
    const ozPerDay = foodKcal / 42; const ozPerMeal = ozPerDay / mealsN;
    setResult({ mer: Math.round(mer), rer: Math.round(rer), foodKcal, treatKcal, ozPerDay: Math.round(ozPerDay * 10) / 10, ozPerMeal: Math.round(ozPerMeal * 10) / 10, mealsCount: mealsN });
    setShowSave(!!activeDog);
  };
  const handleSave = () => { if (!result) return; saveCalculationForActiveDog('calories', `${result.mer} kcal/day, ${result.mealsCount} meals/day`, result as any); refresh(); setShowSave(false); toast({ title: `Saved to ${activeDog?.name}'s profile ✅` }); };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-lg font-serif">🍽️ Calories Per Meal</CardTitle><p className="text-sm text-muted-foreground">Daily kcal target + per-meal split.</p></CardHeader>
      <CardContent className="space-y-4" onPointerDown={stopProp} onClick={stopProp}>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} /></div><div className="space-y-2"><Label>Meals per day</Label><Select value={meals} onValueChange={setMeals}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 meal</SelectItem><SelectItem value="2">2 meals</SelectItem><SelectItem value="3">3 meals</SelectItem></SelectContent></Select></div></div>
        <div className="space-y-2"><Label>Age / Life Stage</Label><Select value={age} onValueChange={setAge}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="puppy_under4">Puppy &lt; 4 months</SelectItem><SelectItem value="puppy_4to12">Puppy 4–12 months</SelectItem><SelectItem value="adult">Adult (1–7 years)</SelectItem><SelectItem value="senior">Senior (7+ years)</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Activity Level</Label><Select value={activity} onValueChange={setActivity}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1.3">Sedentary / Low</SelectItem><SelectItem value="1.6">Moderate (neutered)</SelectItem><SelectItem value="1.8">Moderate (intact)</SelectItem><SelectItem value="2.0">High / Working</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Body Condition</Label><Select value={condition} onValueChange={setCondition}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1.0">Optimal</SelectItem><SelectItem value="0.85">Overweight (reduce)</SelectItem><SelectItem value="1.2">Underweight (increase)</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Treats (% of daily calories)</Label><Select value={treatPct} onValueChange={setTreatPct}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">0% — No treats</SelectItem><SelectItem value="5">5%</SelectItem><SelectItem value="10">10% (AAFCO max)</SelectItem><SelectItem value="15">15%</SelectItem><SelectItem value="20">20%</SelectItem></SelectContent></Select></div>
        <Button className="w-full font-bold" onClick={calc}>🧮 Calculate</Button>
        {result && <div className="p-4 bg-muted rounded-xl border-l-4 border-primary space-y-2"><div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Daily Calories (MER)</div><div className="text-3xl font-bold text-primary">{result.mer} kcal/day</div><div className="text-sm space-y-1 text-muted-foreground"><div>RER (resting): <strong className="text-foreground">{result.rer} kcal</strong></div><div>Food calories: <strong className="text-foreground">{result.foodKcal} kcal/day</strong></div><div>Treat budget: <strong className="text-foreground">{result.treatKcal} kcal/day</strong></div><div>~{result.ozPerDay} oz/day · <strong className="text-foreground">{result.ozPerMeal} oz per meal</strong> ({result.mealsCount} meals)</div></div></div>}
        {showSave && result && <SavePrompt label={`Save to ${activeDog?.name}'s profile?`} onSave={handleSave} onDismiss={() => setShowSave(false)} />}
      </CardContent>
    </Card>
  );
}

const CHOC_TYPES: { label: string; value: string; mgPerG: number }[] = [
  { label: "White chocolate (trace)", value: "white", mgPerG: 0.1 },
  { label: "Milk chocolate", value: "milk", mgPerG: 2.0 },
  { label: "Dark chocolate (70%)", value: "dark", mgPerG: 5.5 },
  { label: "Baker's / unsweetened", value: "bakers", mgPerG: 14.0 },
  { label: "Cocoa powder", value: "cocoa", mgPerG: 40.0 },
];

function ChocolateCalculator() {
  const { activeDog, refresh } = useAppData();
  const { toast } = useToast();
  const [weight, setWeight] = useState(activeDog?.weightKg?.toString() || "25");
  const [chocType, setChocType] = useState("dark");
  const [amount, setAmount] = useState("50");
  const [result, setResult] = useState<{ dose: number; risk: string; advice: string; color: string } | null>(null);
  const [showSave, setShowSave] = useState(false);

  const calc = (e: React.MouseEvent) => {
    e.stopPropagation();
    const w = parseFloat(weight) || 25; const a = parseFloat(amount) || 0; const ct = CHOC_TYPES.find(t => t.value === chocType)!;
    const dose = (a * ct.mgPerG) / w;
    let risk = "Low", color = "green", advice = "Likely safe. Monitor for any unusual behavior.";
    if (dose > 200) { risk = "EXTREME"; color = "red"; advice = "🚨 EMERGENCY — call your vet or animal poison control IMMEDIATELY! (888-426-4435)"; }
    else if (dose > 100) { risk = "High"; color = "red"; advice = "⚠️ High risk of seizures — contact your vet RIGHT AWAY."; }
    else if (dose > 40) { risk = "Severe"; color = "red"; advice = "⚠️ Cardiac & neurological effects possible — call your vet now."; }
    else if (dose > 20) { risk = "Moderate"; color = "amber"; advice = "⚠️ GI upset, muscle tremors possible — call your vet for guidance."; }
    else if (dose > 10) { risk = "Mild"; color = "amber"; advice = "Watch for vomiting, diarrhea, restlessness. Call vet if symptoms develop."; }
    setResult({ dose: Math.round(dose * 10) / 10, risk, advice, color });
    setShowSave(!!activeDog);
  };
  const handleSave = () => { if (!result) return; const ct = CHOC_TYPES.find(t => t.value === chocType)!; saveCalculationForActiveDog('chocolate', `${result.dose} mg/kg — ${result.risk}`, { dose: result.dose, risk: result.risk, chocType: ct.label, amount, dogWeight: weight } as any); refresh(); setShowSave(false); toast({ title: `Saved to ${activeDog?.name}'s profile ✅` }); };
  const colorMap: Record<string, string> = { green: 'border-green-500 bg-green-50 dark:bg-green-950/30', amber: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30', red: 'border-red-500 bg-red-50 dark:bg-red-950/30' };
  const textMap: Record<string, string> = { green: 'text-green-700 dark:text-green-300', amber: 'text-amber-700 dark:text-amber-300', red: 'text-red-700 dark:text-red-300' };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-lg font-serif">🍫 Chocolate Toxicity</CardTitle><p className="text-sm text-muted-foreground">Estimate theobromine dose and risk.</p></CardHeader>
      <CardContent className="space-y-4" onPointerDown={stopProp} onClick={stopProp}>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Dog Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} /></div><div className="space-y-2"><Label>Amount Eaten (g)</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div></div>
        <p className="text-xs text-muted-foreground">💡 A standard chocolate bar ≈ 40–50g · A Hershey's Kiss ≈ 4.5g</p>
        <div className="space-y-2"><Label>Chocolate Type</Label><Select value={chocType} onValueChange={setChocType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
        <Button className="w-full font-bold" variant="destructive" onClick={calc}>⚠️ Calculate Risk</Button>
        {result && <div className={`p-4 rounded-xl border-l-4 ${colorMap[result.color]}`}><div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Theobromine Dose</div><div className={`text-2xl font-bold mb-1 ${textMap[result.color]}`}>{result.dose} mg/kg</div><div className={`text-sm font-semibold mb-2 ${textMap[result.color]}`}>{result.risk} Risk</div><div className="text-sm">{result.advice}</div><div className="text-xs text-muted-foreground mt-3 border-t border-border pt-2">Risk scale: Low &lt;10 · Mild &lt;20 · Moderate &lt;40 · Severe &lt;100 · High &lt;200 · Extreme &gt;200 mg/kg</div></div>}
        {showSave && result && <SavePrompt label={`Save this assessment to ${activeDog?.name}'s profile?`} onSave={handleSave} onDismiss={() => setShowSave(false)} />}
      </CardContent>
    </Card>
  );
}

function FleaCalculator() {
  const { activeDog, refresh } = useAppData();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [medName, setMedName] = useState("");
  const [lastDate, setLastDate] = useState(today);
  const [freq, setFreq] = useState("30");
  const [dates, setDates] = useState<string[]>([]);
  const [showSave, setShowSave] = useState(false);

  const calc = (e: React.MouseEvent) => { e.stopPropagation(); if (!lastDate) return; const result: string[] = []; let d = new Date(lastDate + 'T00:00:00'); for (let i = 0; i < 6; i++) { d = new Date(d.getTime() + parseInt(freq) * 24 * 60 * 60 * 1000); result.push(d.toISOString().split('T')[0]); } setDates(result); setShowSave(!!activeDog); };
  const handleSave = () => { const med = medName || 'Medication'; saveCalculationForActiveDog('flea', `${med} — next: ${dates[0]}`, { medication: med, lastDate, frequency: parseInt(freq), nextDates: dates } as any); refresh(); setShowSave(false); toast({ title: `Saved to ${activeDog?.name}'s profile ✅` }); };
  const overdue = dates[0] && new Date(dates[0]) < new Date();

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-lg font-serif">🐜 Flea, Tick & Worming Schedule</CardTitle><p className="text-sm text-muted-foreground">Enter last dose date and frequency to get the next 6 due dates.</p></CardHeader>
      <CardContent className="space-y-4" onPointerDown={stopProp} onClick={stopProp}>
        <div className="space-y-2"><Label>Medication Name (optional)</Label><Input placeholder="e.g. NexGard, Bravecto, Drontal" value={medName} onChange={e => setMedName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Last Dose Date</Label><Input type="date" value={lastDate} onChange={e => setLastDate(e.target.value)} /></div>
        <div className="space-y-2"><Label>Frequency</Label><Select value={freq} onValueChange={setFreq}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="14">Every 2 weeks (puppy deworming)</SelectItem><SelectItem value="30">Monthly (~30 days)</SelectItem><SelectItem value="84">Every 12 weeks (84 days)</SelectItem><SelectItem value="90">Every 3 months (90 days)</SelectItem><SelectItem value="180">Every 6 months</SelectItem><SelectItem value="365">Yearly</SelectItem></SelectContent></Select></div>
        <Button className="w-full font-bold" onClick={calc}>📅 Generate Schedule</Button>
        {dates.length > 0 && <div className="p-4 bg-muted rounded-xl border-l-4 border-primary"><div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Next 6 Due Dates</div><div className="space-y-2">{dates.map((dt, i) => { const isPast = new Date(dt) < new Date(); const isNext = i === 0; return (<div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0 text-sm"><span className={`font-bold ${isNext && isPast ? 'text-red-600 dark:text-red-400' : isNext ? 'text-primary' : 'text-muted-foreground'}`}>#{i + 1}</span><span className={`font-medium ${isNext ? 'text-foreground' : 'text-muted-foreground'}`}>{dt}</span>{isNext && isPast && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">OVERDUE</span>}{isNext && !isPast && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">NEXT</span>}</div>); })}</div></div>}
        {showSave && dates.length > 0 && <SavePrompt label={`Save schedule to ${activeDog?.name}'s profile?`} onSave={handleSave} onDismiss={() => setShowSave(false)} />}
      </CardContent>
    </Card>
  );
}

const BREED_MAP: Record<string, { walk: number; play: number }> = { toy: { walk: 20, play: 10 }, small: { walk: 30, play: 15 }, medium: { walk: 45, play: 20 }, large: { walk: 60, play: 25 }, pitbull: { walk: 60, play: 30 }, giant: { walk: 50, play: 15 } };

function ExerciseCalculator() {
  const { activeDog, refresh } = useAppData();
  const { toast } = useToast();
  const [breed, setBreed] = useState("medium");
  const [age, setAge] = useState("adult");
  const [weight, setWeight] = useState(activeDog?.weightKg?.toString() || "25");
  const [health, setHealth] = useState("healthy");
  const [result, setResult] = useState<{ walk: number; play: number; plan: string; detail: string } | null>(null);
  const [showSave, setShowSave] = useState(false);

  const calc = (e: React.MouseEvent) => {
    e.stopPropagation();
    let { walk, play } = BREED_MAP[breed] || BREED_MAP.medium;
    if (age === 'puppy') { walk = Math.round(walk * 0.6); play = Math.round(play * 0.5); }
    else if (age === 'senior') { walk = Math.round(walk * 0.7); play = Math.round(play * 0.5); }
    if (health === 'brachy') { walk = Math.round(walk * 0.6); play = Math.round(play * 0.5); }
    else if (health === 'cardiac') { walk = Math.round(walk * 0.4); play = Math.round(play * 0.3); }
    else if (health === 'ortho') { walk = Math.round(walk * 0.5); play = Math.round(play * 0.4); }
    const plan = `${walk} min walk + ${play} min play`;
    let detail = `For a ${weight}kg ${age} dog.`;
    if (health !== 'healthy') detail += ' ⚠️ Always adjust to your dog\'s tolerance. Consult your vet.';
    setResult({ walk, play, plan, detail }); setShowSave(!!activeDog);
  };
  const handleSave = () => { if (!result) return; saveCalculationForActiveDog('exercise', result.plan, { breed, age, weight, health, ...result } as any); refresh(); setShowSave(false); toast({ title: `Saved to ${activeDog?.name}'s profile ✅` }); };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-lg font-serif">🏃 Daily Exercise Needs</CardTitle><p className="text-sm text-muted-foreground">Walking minutes + high-intensity play, adjusted for breed, age, and health.</p></CardHeader>
      <CardContent className="space-y-4" onPointerDown={stopProp} onClick={stopProp}>
        <div className="space-y-2"><Label>Breed Group</Label><Select value={breed} onValueChange={setBreed}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="toy">Toy (Chihuahua, Yorkie)</SelectItem><SelectItem value="small">Small (Dachshund, Pug)</SelectItem><SelectItem value="medium">Medium (Spaniel, Border Collie)</SelectItem><SelectItem value="large">Large (Labrador, Golden)</SelectItem><SelectItem value="pitbull">Pitbull / Bully Breeds</SelectItem><SelectItem value="giant">Giant (Great Dane, Mastiff)</SelectItem></SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Age</Label><Select value={age} onValueChange={setAge}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="puppy">Puppy (&lt;1 year)</SelectItem><SelectItem value="adult">Adult (1–7 years)</SelectItem><SelectItem value="senior">Senior (7+ years)</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} /></div></div>
        <div className="space-y-2"><Label>Health State</Label><Select value={health} onValueChange={setHealth}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="healthy">Healthy</SelectItem><SelectItem value="brachy">Brachycephalic (flat-faced)</SelectItem><SelectItem value="cardiac">Cardiac / respiratory issue</SelectItem><SelectItem value="ortho">Orthopaedic condition</SelectItem></SelectContent></Select></div>
        <Button className="w-full font-bold" onClick={calc}>🏋️ Calculate Plan</Button>
        {result && <div className="p-4 bg-muted rounded-xl border-l-4 border-primary"><div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Daily Plan</div><div className="text-2xl font-bold text-primary mb-1">{result.plan}</div><div className="text-sm text-muted-foreground">{result.detail}</div><div className="mt-3 grid grid-cols-2 gap-2"><div className="bg-background rounded-lg p-2 text-center"><div className="text-xl font-bold">{result.walk}</div><div className="text-xs text-muted-foreground">min walking</div></div><div className="bg-background rounded-lg p-2 text-center"><div className="text-xl font-bold">{result.play}</div><div className="text-xs text-muted-foreground">min active play</div></div></div></div>}
        {showSave && result && <SavePrompt label={`Save plan to ${activeDog?.name}'s profile?`} onSave={handleSave} onDismiss={() => setShowSave(false)} />}
      </CardContent>
    </Card>
  );
}

function TreatsCalculator() {
  const { activeDog, refresh } = useAppData();
  const { toast } = useToast();
  const [weight, setWeight] = useState(activeDog?.weightKg?.toString() || "25");
  const [age, setAge] = useState("adult");
  const [activity, setActivity] = useState("1.6");
  const [result, setResult] = useState<{ budget: number; mer: number; examples: string } | null>(null);
  const [showSave, setShowSave] = useState(false);

  const calc = (e: React.MouseEvent) => {
    e.stopPropagation(); const w = parseFloat(weight) || 25; const actF = parseFloat(activity) || 1.6;
    let ageFactor = 1.0; if (age === 'puppy_under4') ageFactor = 3.0; else if (age === 'puppy_4to12') ageFactor = 2.0; else if (age === 'senior') ageFactor = 0.9;
    const rer = 70 * Math.pow(w, 0.75); const mer = Math.round(rer * actF * ageFactor); const budget = Math.round(mer * 0.10);
    const exs: string[] = []; if (budget >= 5) exs.push(`${Math.round(budget / 5)} baby carrots (~5 kcal ea.)`); if (budget >= 10) exs.push(`${Math.round(budget / 10)} small training treats (~10 kcal ea.)`); if (budget >= 20) exs.push(`${Math.round(budget / 20)} medium biscuits (~20 kcal ea.)`); if (budget >= 80) exs.push(`${Math.round(budget / 80)} dental chews (~80 kcal ea.)`);
    setResult({ budget, mer, examples: exs.slice(0, 2).join(' OR ') }); setShowSave(!!activeDog);
  };
  const handleSave = () => { if (!result) return; saveCalculationForActiveDog('treats', `${result.budget} kcal/day treat budget`, result as any); refresh(); setShowSave(false); toast({ title: `Saved to ${activeDog?.name}'s profile ✅` }); };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-lg font-serif">🍪 10% Treat Allowance</CardTitle><p className="text-sm text-muted-foreground">AAFCO recommends treats stay under 10% of daily calories.</p></CardHeader>
      <CardContent className="space-y-4" onPointerDown={stopProp} onClick={stopProp}>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} /></div><div className="space-y-2"><Label>Activity</Label><Select value={activity} onValueChange={setActivity}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1.3">Sedentary</SelectItem><SelectItem value="1.6">Moderate (neutered)</SelectItem><SelectItem value="1.8">Moderate (intact)</SelectItem><SelectItem value="2.0">High / Working</SelectItem></SelectContent></Select></div></div>
        <div className="space-y-2"><Label>Life Stage</Label><Select value={age} onValueChange={setAge}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="puppy_under4">Puppy &lt;4 months</SelectItem><SelectItem value="puppy_4to12">Puppy 4–12 months</SelectItem><SelectItem value="adult">Adult (1–7 years)</SelectItem><SelectItem value="senior">Senior (7+ years)</SelectItem></SelectContent></Select></div>
        <Button className="w-full font-bold" onClick={calc}>🍪 Calculate Treat Budget</Button>
        {result && <div className="p-4 bg-muted rounded-xl border-l-4 border-amber-500"><div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Daily Treat Budget</div><div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">{result.budget} kcal/day</div><div className="text-sm text-muted-foreground">That's <strong className="text-foreground">10%</strong> of {result.mer} kcal/day total.</div>{result.examples && <div className="text-sm text-muted-foreground mt-1">Looks like: <strong className="text-foreground">{result.examples}</strong></div>}</div>}
        {showSave && result && <SavePrompt label={`Save to ${activeDog?.name}'s profile?`} onSave={handleSave} onDismiss={() => setShowSave(false)} />}
      </CardContent>
    </Card>
  );
}

function CostCalculator() {
  const { activeDog, refresh } = useAppData();
  const { toast } = useToast();
  const [nameA, setNameA] = useState(""); const [priceA, setPriceA] = useState("45"); const [sizeA, setSizeA] = useState("15"); const [portionA, setPortionA] = useState("300");
  const [nameB, setNameB] = useState(""); const [priceB, setPriceB] = useState("72"); const [sizeB, setSizeB] = useState("11.3"); const [portionB, setPortionB] = useState("230");
  const [result, setResult] = useState<any>(null);
  const [showSave, setShowSave] = useState(false);

  const calc = (e: React.MouseEvent) => {
    e.stopPropagation(); const pA = parseFloat(priceA) || 0, sA = parseFloat(sizeA) || 1, portA = parseFloat(portionA) || 100; if (pA <= 0) return;
    const daysA = (sA * 1000) / portA; const cA = pA / daysA;
    let r: any = { foodA: nameA || 'Food A', costA: Math.round(cA * 100) / 100, monthA: Math.round(cA * 30 * 100) / 100, yearA: Math.round(cA * 365 * 100) / 100, daysA: Math.round(daysA * 10) / 10 };
    const pB = parseFloat(priceB) || 0, sB = parseFloat(sizeB) || 1, portB = parseFloat(portionB) || 100;
    if (pB > 0 && sB > 0 && portB > 0) { const daysB = (sB * 1000) / portB; const cB = pB / daysB; r = { ...r, foodB: nameB || 'Food B', costB: Math.round(cB * 100) / 100, monthB: Math.round(cB * 30 * 100) / 100, yearB: Math.round(cB * 365 * 100) / 100, daysB: Math.round(daysB * 10) / 10, cheaper: cA < cB ? (nameA || 'Food A') : (nameB || 'Food B'), diff: Math.abs(cA - cB).toFixed(2) }; }
    setResult(r); setShowSave(!!activeDog);
  };
  const handleSave = () => { if (!result) return; saveCalculationForActiveDog('cost', `${result.foodA}: $${result.costA}/day`, result); refresh(); setShowSave(false); toast({ title: `Saved to ${activeDog?.name}'s profile ✅` }); };
  const FoodInput = ({ label, name, setName, price, setPrice, size, setSize, portion, setPortion }: any) => (
    <div className="bg-muted/40 rounded-xl p-3 space-y-3">
      <div className="font-bold text-sm text-primary">{label}</div>
      <div className="space-y-2"><Label>Name (optional)</Label><Input placeholder="e.g. Brand X kibble" value={name} onChange={e => setName(e.target.value)} /></div>
      <div className="grid grid-cols-3 gap-2"><div className="space-y-1"><Label className="text-xs">Price ($)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} /></div><div className="space-y-1"><Label className="text-xs">Bag (kg)</Label><Input type="number" value={size} onChange={e => setSize(e.target.value)} /></div><div className="space-y-1"><Label className="text-xs">Portion (g/day)</Label><Input type="number" value={portion} onChange={e => setPortion(e.target.value)} /></div></div>
    </div>
  );

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-lg font-serif">💰 True Cost Per Day</CardTitle><p className="text-sm text-muted-foreground">Bag price ÷ days the bag lasts = the honest cost.</p></CardHeader>
      <CardContent className="space-y-4" onPointerDown={stopProp} onClick={stopProp}>
        <FoodInput label="Food A" name={nameA} setName={setNameA} price={priceA} setPrice={setPriceA} size={sizeA} setSize={setSizeA} portion={portionA} setPortion={setPortionA} />
        <FoodInput label="Food B (optional — compare)" name={nameB} setName={setNameB} price={priceB} setPrice={setPriceB} size={sizeB} setSize={setSizeB} portion={portionB} setPortion={setPortionB} />
        <Button className="w-full font-bold" onClick={calc}>💰 Calculate Cost</Button>
        {result && <div className="p-4 bg-muted rounded-xl border-l-4 border-primary space-y-2 text-sm"><div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Cost Comparison</div><div><strong className="text-foreground">{result.foodA}:</strong> <span className="text-primary font-bold">${result.costA}/day</span> · ${result.monthA}/mo · ${result.yearA}/yr · {result.daysA} days/bag</div>{result.foodB && <><div><strong className="text-foreground">{result.foodB}:</strong> <span className="text-primary font-bold">${result.costB}/day</span> · ${result.monthB}/mo · ${result.yearB}/yr · {result.daysB} days/bag</div><div className="pt-2 border-t border-border font-semibold text-foreground">🏆 <strong>{result.cheaper}</strong> is cheaper by ${result.diff}/day (${(parseFloat(result.diff) * 365).toFixed(0)}/year)</div></>}</div>}
        {showSave && result && <SavePrompt label={`Save to ${activeDog?.name}'s profile?`} onSave={handleSave} onDismiss={() => setShowSave(false)} />}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════
export function UtilitiesPage() {
  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="pt-1">
        <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">Health Tools</h1>
        <p className="text-muted-foreground text-sm font-medium">Calculators, walk tracker, and shared access. Always consult your vet in emergencies.</p>
      </div>
      <WalkTracker />
      <WalkerLogin />
      <RRCalculator />
      <CaloriesCalculator />
      <ChocolateCalculator />
      <FleaCalculator />
      <ExerciseCalculator />
      <TreatsCalculator />
      <CostCalculator />
    </div>
  );
}
