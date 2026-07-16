import React, { useState, useEffect } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { updateActiveDog, addDog, deleteDog, Dog } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Moon, Sun, User, Droplets } from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function Header({ setView }: { setView: (v: any) => void }) {
  const { data, activeDog, refresh } = useAppData();
  const { theme, setTheme } = useTheme();
  const [dogSelectorOpen, setDogSelectorOpen] = useState(false);
  const [addDogOpen, setAddDogOpen] = useState(false);
  
  const [newDogName, setNewDogName] = useState("");
  const [newDogWeight, setNewDogWeight] = useState("");

  const handleDogSelect = (id: string) => {
    const updated = { ...data, activeDogId: id };
    localStorage.setItem("freshbowl_v2", JSON.stringify(updated));
    refresh();
    setDogSelectorOpen(false);
  };

  const handleAddDog = () => {
    if (!newDogName || !newDogWeight) return;
    addDog({
      name: newDogName,
      weightKg: Number(newDogWeight),
      ageMonths: 12,
      sex: "male",
      neutered: true,
      activityLevel: "moderate",
      bodyCondition: "optimal"
    });
    refresh();
    setAddDogOpen(false);
    setNewDogName("");
    setNewDogWeight("");
    setDogSelectorOpen(false);
  };

  const [dogToDelete, setDogToDelete] = useState<Dog | null>(null);

  const confirmDelete = (d: Dog) => {
    setDogToDelete(d);
  };

  const executeDelete = () => {
    if (dogToDelete) {
      deleteDog(dogToDelete.id);
      refresh();
      setDogToDelete(null);
      if (data.dogs.length <= 1) {
        setDogSelectorOpen(false);
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setDogSelectorOpen(true)}>
          <Avatar className="h-9 w-9 border-2 border-primary ring-2 ring-primary/20">
            {activeDog?.profilePic ? (
              <AvatarImage src={activeDog.profilePic} />
            ) : (
              <AvatarFallback className="bg-primary/20 text-primary font-bold font-serif">
                {activeDog ? activeDog.name.charAt(0) : "?"}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold font-serif text-foreground tracking-tight">FreshBowl</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setView("profile")}>
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Dog Selector Bottom Sheet */}
      <Sheet open={dogSelectorOpen} onOpenChange={setDogSelectorOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 max-h-[80vh] overflow-y-auto">
          <SheetTitle className="text-center font-serif text-xl mb-4">Your Dogs</SheetTitle>
          <div className="space-y-2">
            {data.dogs.map(d => (
              <div key={d.id} className="flex items-center justify-between bg-card border rounded-xl p-3 shadow-sm relative group overflow-hidden">
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => handleDogSelect(d.id)}
                >
                  <Avatar className="h-10 w-10 border border-primary/20">
                    {d.profilePic ? <AvatarImage src={d.profilePic} /> : <AvatarFallback className="bg-primary/10 text-primary font-bold">{d.name.charAt(0)}</AvatarFallback>}
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold">{d.name}</span>
                    <span className="text-xs text-muted-foreground">{d.weightKg} kg</span>
                  </div>
                </div>
                {activeDog?.id === d.id && (
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full mr-2">Active</span>
                )}
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => confirmDelete(d)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" className="w-full mt-4 h-14 border-dashed border-2 text-muted-foreground hover:text-foreground" onClick={() => setAddDogOpen(true)}>
              <Plus className="mr-2 h-5 w-5" /> Add Dog
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Dog Dialog */}
      <Dialog open={addDogOpen} onOpenChange={setAddDogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Dog</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Bella" value={newDogName} onChange={e => setNewDogName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input type="number" placeholder="25" value={newDogWeight} onChange={e => setNewDogWeight(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={handleAddDog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!dogToDelete} onOpenChange={(o) => !o && setDogToDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Remove {dogToDelete?.name}?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete {dogToDelete?.name} and all their data, including logs and recipes. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" className="flex-1" onClick={() => setDogToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={executeDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
