import React, { useState, useEffect } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { updateActiveDog, deleteDog } from "@/lib/storage";
import { generateRotation } from "@/lib/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Camera, Check, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const PROTEINS = ["Chicken", "Turkey", "Duck", "Beef", "Lamb", "Pork", "Salmon", "Sardines", "Venison", "Rabbit"];
const ORGANS = ["Chicken Liver", "Beef Liver", "Chicken Heart", "Beef Heart", "Kidney", "Spleen"];
const VEGGIES = ["Collard Greens", "Broccoli", "Spinach", "Kale", "Zucchini", "Carrot", "Pumpkin"];
const STARCHES = ["Sweet Potato", "Brown Rice", "Quinoa", "Oats", "Butternut Squash"];
const CONSTANTS = ["Fish Oil", "Kelp Powder", "Raw Egg", "Green-Lipped Mussel", "Turmeric"];

function ChipSelector({ options, selected, onChange, title }: { options: string[], selected: string[], onChange: (v: string[]) => void, title: string }) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(x => x !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <div className="space-y-2 mb-4">
      <Label className="text-sm font-bold text-primary-dark">{title}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => {
          const isSel = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() => toggle(o)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                isSel 
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-105' 
                  : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              {o}
            </button>
          )
        })}
      </div>
    </div>
  );
}

export function ProfilePage({ setView }: { setView: (v: string) => void }) {
  const { activeDog, data, refresh } = useAppData();
  const { toast } = useToast();
  
  const [form, setForm] = useState<any>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (activeDog) {
      setForm({ ...activeDog });
    }
  }, [activeDog]);

  if (!activeDog || !form) return null;

  const saveProfile = () => {
    updateActiveDog({
      name: form.name,
      weightKg: Number(form.weightKg),
      ageMonths: Number(form.ageMonths),
      activityLevel: form.activityLevel,
      bodyCondition: form.bodyCondition
    });
    toast({ title: "Profile Saved", description: "Dog details updated." });
  };

  const handleFavoriteChange = (category: keyof typeof form.favorites, values: string[]) => {
    const updated = { ...form, favorites: { ...form.favorites, [category]: values } };
    setForm(updated);
    updateActiveDog({ favorites: updated.favorites });
  };

  const handleRebuild = () => {
    if (form.favorites.proteins.length < 2) {
      toast({ title: "Not enough variety", description: "Select at least 2 proteins for a balanced rotation.", variant: "destructive" });
      return;
    }
    const rotation = generateRotation(form);
    updateActiveDog({ currentRotation: rotation });
    toast({ title: `Rotation rebuilt for ${form.name}!`, description: "7 days planned based on favorites.", className: "bg-green-50 text-green-900 border-green-200" });
    refresh();
  };

  const executeDelete = () => {
    deleteDog(activeDog.id);
    refresh();
    setView('home');
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setView('home')} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-3xl font-serif font-bold tracking-tight">Dog Profile</h2>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-card relative">
        <div className="h-20 bg-primary/20 absolute top-0 left-0 right-0"></div>
        <CardContent className="pt-10 relative">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-card bg-muted flex items-center justify-center shadow-md relative">
              {form.profilePic ? (
                <img src={form.profilePic} className="w-full h-full object-cover rounded-full" alt="Dog" />
              ) : (
                <span className="text-3xl font-serif font-bold text-primary">{form.name.charAt(0)}</span>
              )}
              <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-sm hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} onBlur={saveProfile} />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input type="number" value={form.weightKg} onChange={e => setForm({...form, weightKg: e.target.value})} onBlur={saveProfile} />
            </div>
            <div className="space-y-2">
              <Label>Age (months)</Label>
              <Input type="number" value={form.ageMonths} onChange={e => setForm({...form, ageMonths: e.target.value})} onBlur={saveProfile} />
            </div>
            <div className="space-y-2">
              <Label>Activity</Label>
              <Select value={form.activityLevel} onValueChange={v => {setForm({...form, activityLevel: v}); updateActiveDog({activityLevel: v as any})}}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Body Condition</Label>
              <Select value={form.bodyCondition} onValueChange={v => {setForm({...form, bodyCondition: v}); updateActiveDog({bodyCondition: v as any})}}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="underweight">Underweight (Needs to gain)</SelectItem>
                  <SelectItem value="optimal">Optimal / Ideal</SelectItem>
                  <SelectItem value="overweight">Overweight (Needs to lose)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <h3 className="font-serif font-bold text-xl mb-4 text-primary-dark">Favorites for Rotation</h3>
          <p className="text-sm text-muted-foreground mb-6">Select ingredients to include in the automatic meal generator.</p>

          <ChipSelector title="Proteins (Select 3-7)" options={PROTEINS} selected={form.favorites.proteins} onChange={(v) => handleFavoriteChange('proteins', v)} />
          <ChipSelector title="Organs (Select 2-4)" options={ORGANS} selected={form.favorites.organs} onChange={(v) => handleFavoriteChange('organs', v)} />
          <ChipSelector title="Veggies (Select 3-6)" options={VEGGIES} selected={form.favorites.veggies} onChange={(v) => handleFavoriteChange('veggies', v)} />
          <ChipSelector title="Starches (Optional)" options={STARCHES} selected={form.favorites.starches} onChange={(v) => handleFavoriteChange('starches', v)} />
          <ChipSelector title="Daily Constants" options={CONSTANTS} selected={form.favorites.dailyConstants} onChange={(v) => handleFavoriteChange('dailyConstants', v)} />

          <Button size="lg" className="w-full mt-6 h-14 text-base font-bold tracking-wide shadow-md shadow-primary/20" onClick={handleRebuild}>
            <Save className="w-5 h-5 mr-2" /> Save & Rebuild Rotation
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <div className="pt-8 pb-4">
        <div className="border border-destructive/20 bg-destructive/5 rounded-2xl p-4 text-center">
          <h3 className="text-destructive font-bold mb-2">Danger Zone</h3>
          <p className="text-xs text-muted-foreground mb-4">Permanently delete this dog's profile, recipes, and history.</p>
          <Button variant="destructive" className="w-full" onClick={() => setShowDelete(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Remove {form.name}
          </Button>
        </div>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              This will permanently delete {form.name} and all their data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" className="flex-1" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={executeDelete}>Delete Forever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
