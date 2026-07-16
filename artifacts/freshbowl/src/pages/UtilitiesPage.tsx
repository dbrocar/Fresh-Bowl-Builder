import React, { useState, useEffect } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { calculateMER } from "@/lib/storage";

export function UtilitiesPage() {
  const { activeDog } = useAppData();

  // Calc States
  const [rrWindow, setRrWindow] = useState("30");
  const [taps, setTaps] = useState(0);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [bpmResult, setBpmResult] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timerActive && timer === 0) {
      setTimerActive(false);
      const factor = 60 / parseInt(rrWindow);
      setBpmResult(taps * factor);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer, taps, rrWindow]);

  const startRrTimer = () => {
    setTaps(1);
    setTimer(parseInt(rrWindow));
    setTimerActive(true);
    setBpmResult(null);
  };

  const handleTap = () => {
    if (timerActive) setTaps(t => t + 1);
    else startRrTimer();
  };

  // Chocolate
  const [chocWeight, setChocWeight] = useState(activeDog?.weightKg.toString() || "20");
  const [chocType, setChocType] = useState("150"); // dark
  const [chocAmount, setChocAmount] = useState("50");
  const [chocResult, setChocResult] = useState<{dose: number, status: string} | null>(null);

  const calcChocolate = () => {
    const mg = parseFloat(chocType) * (parseFloat(chocAmount) / 28.35); // Approx mg/oz * oz
    // Actually theobromine mg per g:
    // White: 0.1 mg/g (value=3)
    // Milk: 1.5 - 2.0 mg/g (value=45)
    // Dark: 5.0 - 5.5 mg/g (value=150)
    // Baker: 14 mg/g (value=390)
    const mgTotal = (parseFloat(chocType) / 28.35) * parseFloat(chocAmount);
    const dose = mgTotal / parseFloat(chocWeight);
    let status = "Low Risk";
    if (dose > 20) status = "Mild Tox (GI upset)";
    if (dose > 40) status = "Severe Tox (Cardiac)";
    if (dose > 60) status = "Seizures / Fatal";
    setChocResult({ dose: Math.round(dose), status });
  };

  // Prevent focus stealing
  const stopProp = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">Health Tools</h2>
        <p className="text-muted-foreground text-sm font-medium">Quick veterinary calculators. Always consult your vet in emergencies.</p>
      </div>

      <div onPointerDown={stopProp} onClick={stopProp} className="space-y-4">
        
        {/* RR Calculator */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">💨 Resting Respiratory Rate</CardTitle>
            <p className="text-sm text-muted-foreground">Count breaths while sleeping to monitor heart health.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Counting Window</Label>
              <Select value={rrWindow} onValueChange={setRrWindow} disabled={timerActive}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds (recommended)</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <button 
              onClick={handleTap}
              className={`w-full py-8 rounded-xl text-2xl font-bold text-white transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none select-none ${timerActive ? 'bg-green-500' : 'bg-primary'}`}
            >
              {timerActive ? `Tap (Taps: ${taps})` : '👆 Tap First Breath'}
            </button>
            
            <div className="flex justify-between text-sm font-medium bg-muted p-3 rounded-lg">
              <span>Time Left: {timer}s</span>
              <span>Taps: {taps}</span>
            </div>

            {bpmResult !== null && (
              <div className={`p-4 rounded-lg border-l-4 ${bpmResult > 30 ? 'bg-red-50 border-red-500 text-red-900 dark:bg-red-900/20 dark:text-red-200' : 'bg-green-50 border-green-500 text-green-900 dark:bg-green-900/20 dark:text-green-200'}`}>
                <div className="font-bold text-lg mb-1">{bpmResult} BPM</div>
                <div className="text-sm">{bpmResult > 30 ? 'Elevated! Contact vet if persistently over 30 while sleeping.' : 'Normal range (< 30 BPM).'}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chocolate Toxicity */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">🍫 Chocolate Toxicity</CardTitle>
            <p className="text-sm text-muted-foreground">Estimate risk if your dog ate chocolate.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dog Weight (kg)</Label>
                <Input type="number" value={chocWeight} onChange={e => setChocWeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Amount Eaten (g)</Label>
                <Input type="number" value={chocAmount} onChange={e => setChocAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Chocolate Type</Label>
              <Select value={chocType} onValueChange={setChocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">White Chocolate (Lowest)</SelectItem>
                  <SelectItem value="45">Milk Chocolate</SelectItem>
                  <SelectItem value="150">Dark Chocolate (70%)</SelectItem>
                  <SelectItem value="390">Baker's / Cocoa Powder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="w-full font-bold" variant="destructive" onClick={calcChocolate}>Calculate Risk</Button>

            {chocResult && (
              <div className="p-4 bg-muted rounded-lg border-l-4 border-amber-500">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Dose Result</div>
                <div className="font-bold text-2xl mb-1">{chocResult.dose} mg/kg</div>
                <div className="text-sm font-medium">{chocResult.status}</div>
                <div className="text-xs text-muted-foreground mt-2">Always call an emergency vet if symptomatic.</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercise Needs */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">🏃 Exercise Needs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Breed Group</Label>
              <Select defaultValue="medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="toy">Toy (Chihuahua, Yorkie)</SelectItem>
                  <SelectItem value="small">Small (Dachshund, Pug)</SelectItem>
                  <SelectItem value="medium">Medium (Spaniel, Border Collie)</SelectItem>
                  <SelectItem value="large">Large (Labrador, Golden)</SelectItem>
                  <SelectItem value="pitbull">Pitbull / Bully Breeds</SelectItem>
                  <SelectItem value="giant">Giant (Great Dane)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => alert("Provides 60 min walk + 30 min play target.")}>Estimate Needs</Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
