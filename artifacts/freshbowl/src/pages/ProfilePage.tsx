import React, { useState, useEffect, useRef } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { updateActiveDog, deleteDog, type SavedCalculation } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Camera, Check, ArrowLeft, Save, Weight, HeartPulse, Stethoscope, Syringe, Scissors, Building, Users, Share2, Dog, Calculator, GraduationCap, Phone, MapPin, Mail, UserCircle, Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { HealthCheck, GroomingRecord, Vaccination, VetInfo, VaccineType, Contact } from "@/lib/care";
import type { Medication, WeightEntry } from "@/lib/storage";
import {
  addHealthCheck, latestHealthCheck, healthAverageForDays, getHealthChecks,
  addWeightEntry, removeWeightEntry, getWeightLog,
  addMedication, removeMedication, getMedications, nextDueDate, isOverdue, recordMedicationGiven,
  addGrooming, removeGrooming, getGrooming,
  addVaccination, removeVaccination, getVaccinations, VACCINE_TYPES, vaccinationName,
  updateVetInfo, getVetInfo, makeId,
  addTraining, removeTraining, getTraining, trainingStats,
  addSharedAccess, getSharedAccesses, removeSharedAccess
} from "@/lib/care";
import { formatWeight, loadSettings } from "@/lib/settings";

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
      <Label className="text-sm font-bold text-foreground">{title}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => {
          const isSel = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() => toggle(o)}
              className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                isSel
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-105'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-primary/5'
              )}
            >
              {o}
            </button>
          )
        })}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="bg-primary/10 p-1.5 rounded-lg"><Icon className="w-4 h-4 text-primary" /></div>
      <h3 className="font-serif font-bold text-base text-foreground">{title}</h3>
    </div>
  );
}

export function ProfilePage({ setView }: { setView: (v: string) => void }) {
  const { activeDog, data, refresh } = useAppData();
  const { toast } = useToast();
  const [form, setForm] = useState<any>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (activeDog) setForm({ ...activeDog });
  }, [activeDog]);

  if (!activeDog || !form) return null;

  const saveProfile = () => {
    updateActiveDog({
      name: form.name,
      weightKg: Number(form.weightKg),
      ageMonths: Number(form.ageMonths),
      activityLevel: form.activityLevel,
      bodyCondition: form.bodyCondition,
      breed: form.breed,
      healthNotes: form.healthNotes,
    });
    toast({ title: "Profile Saved", description: "Dog details updated." });
  };

  const handleFavoriteChange = (category: string, values: string[]) => {
    const updated = { ...form, favorites: { ...form.favorites, [category]: values } };
    setForm(updated);
    updateActiveDog({ favorites: updated.favorites });
  };

  const executeDelete = () => {
    deleteDog(activeDog.id);
    refresh();
    setView('home');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 300 / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL("image/jpeg", 0.85);
        updateActiveDog({ profilePic: url });
        setForm({ ...form, profilePic: url });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ── Health Check Panel ──
  function HealthCheckPanel() {
    const [checks, setChecks] = useState(getHealthChecks());
    const [energy, setEnergy] = useState(3);
    const [appetite, setAppetite] = useState(3);
    const [stool, setStool] = useState(3);
    const [coat, setCoat] = useState(3);
    const [mood, setMood] = useState(3);
    const [note, setNote] = useState("");
    const [tick, setTick] = useState(0);
    const refreshChecks = () => { setChecks(getHealthChecks()); setTick(t => t + 1); };
    const avg7 = healthAverageForDays(7);
    const avg30 = healthAverageForDays(30);

    const Rating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} className={cn("w-8 h-8 rounded-lg text-sm font-bold transition-colors",
            value >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{n}</button>
        ))}
      </div>
    );

    const submit = () => {
      addHealthCheck({ date: new Date().toISOString(), energy: energy as 1 | 2 | 3 | 4 | 5, appetite: appetite as 1 | 2 | 3 | 4 | 5, stool: stool as 1 | 2 | 3 | 4 | 5, coat: coat as 1 | 2 | 3 | 4 | 5, mood: mood as 1 | 2 | 3 | 4 | 5, note });
      refreshChecks();
      toast({ title: "Daily check saved" });
      setNote("");
    };

    const latest = latestHealthCheck();

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none shadow-sm bg-card"><CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{avg7.count ? avg7.score : "—"}</div>
            <div className="text-[10px] text-muted-foreground font-medium">7-day avg</div>
          </CardContent></Card>
          <Card className="border-none shadow-sm bg-card"><CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{avg30.count ? avg30.score : "—"}</div>
            <div className="text-[10px] text-muted-foreground font-medium">30-day avg</div>
          </CardContent></Card>
        </div>

        {latest && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            Latest check: <strong className="text-foreground">{latest.score}/5</strong> on {new Date(latest.date).toLocaleDateString()}
          </div>
        )}

        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1"><Label className="text-xs">Energy</Label><Rating value={energy} onChange={setEnergy} /></div>
            <div className="space-y-1"><Label className="text-xs">Appetite</Label><Rating value={appetite} onChange={setAppetite} /></div>
            <div className="space-y-1"><Label className="text-xs">Stool</Label><Rating value={stool} onChange={setStool} /></div>
            <div className="space-y-1"><Label className="text-xs">Coat</Label><Rating value={coat} onChange={setCoat} /></div>
            <div className="space-y-1"><Label className="text-xs">Mood</Label><Rating value={mood} onChange={setMood} /></div>
            <Textarea placeholder="Optional notes..." value={note} onChange={e => setNote(e.target.value)} className="h-16 text-sm" />
            <Button className="w-full" onClick={submit}><Save className="w-4 h-4 mr-2" /> Save Daily Check</Button>
          </CardContent>
        </Card>

        {checks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent checks</h4>
            {checks.slice().reverse().slice(0, 10).map(c => (
              <div key={c.date} className="flex justify-between items-center bg-muted/40 rounded-lg px-3 py-2 text-sm">
                <span>{new Date(c.date).toLocaleDateString()}</span>
                <span className="font-bold">{c.score}/5</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Weight Tracking ──
  function WeightPanel() {
    const unit = loadSettings().weightUnit;
    const [weightInput, setWeightInput] = useState("");
    const [log, setLog] = useState(getWeightLog());
    const reload = () => setLog(getWeightLog());

    const add = () => {
      const w = parseFloat(weightInput);
      if (!w || w <= 0) return;
      const kg = unit === "lb" ? w / 2.20462 : w;
      addWeightEntry(kg);
      reload();
      setWeightInput("");
      toast({ title: "Weight logged" });
    };

    const remove = (id: string) => {
      removeWeightEntry(id); reload();
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input type="number" placeholder={unit} value={weightInput} onChange={e => setWeightInput(e.target.value)} className="flex-1" />
          <Button onClick={add}><Weight className="w-4 h-4 mr-2" /> Log</Button>
        </div>
        {log.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No weights logged yet.</div>}
        {log.length > 0 && (
          <div className="space-y-2">
            {log.slice().reverse().map(e => (
              <div key={e.id} className="flex justify-between items-center bg-muted/40 rounded-lg px-3 py-2 text-sm">
                <span>{new Date(e.date).toLocaleDateString()}</span>
                <span className="font-bold">{formatWeight(e.kg)}</span>
                <button onClick={() => remove(e.id)} className="text-destructive text-xs">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Medications ──
  function MedicationPanel() {
    const [meds, setMeds] = useState<Medication[]>(getMedications());
    const [name, setName] = useState(""); const [dosage, setDosage] = useState(""); const [freq, setFreq] = useState("30"); const [last, setLast] = useState(new Date().toISOString().split("T")[0]); const [notes, setNotes] = useState("");
    const reload = () => setMeds(getMedications());

    const add = () => {
      if (!name) return;
      addMedication({ name, dosage, frequencyDays: parseInt(freq) || 30, lastDate: last, notes });
      reload(); setName(""); setDosage(""); setNotes("");
      toast({ title: "Medication saved" });
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Dosage" value={dosage} onChange={e => setDosage(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={freq} onValueChange={setFreq}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Daily</SelectItem>
              <SelectItem value="7">Weekly</SelectItem>
              <SelectItem value="14">Every 2 weeks</SelectItem>
              <SelectItem value="30">Monthly</SelectItem>
              <SelectItem value="90">Every 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={last} onChange={e => setLast(e.target.value)} />
        </div>
        <Textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="h-16 text-sm" />
        <Button className="w-full" onClick={add}><Syringe className="w-4 h-4 mr-2" /> Add Medication</Button>
        <div className="space-y-2">
          {meds.map(m => (
            <div key={m.id} className={cn("p-3 rounded-xl border text-sm", isOverdue(m) ? "border-red-500/30 bg-red-500/10" : "border-border/40 bg-muted/40")}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.dosage} · Next: {nextDueDate(m)}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { recordMedicationGiven(m.id); reload(); toast({ title: "Dose recorded" }); }}>Given</Button>
                  <Button size="sm" variant="ghost" className="text-destructive h-7 px-2" onClick={() => { removeMedication(m.id); reload(); }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              {isOverdue(m) && <div className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">Overdue</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Grooming ──
  function GroomingPanel() {
    const [records, setRecords] = useState<GroomingRecord[]>(getGrooming());
    const [type, setType] = useState<any>("Brush"); const [date, setDate] = useState(new Date().toISOString().split("T")[0]); const [notes, setNotes] = useState("");
    const reload = () => setRecords(getGrooming());
    const add = () => { addGrooming({ type, date, notes }); reload(); setNotes(""); toast({ title: "Grooming logged" }); };
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Bath", "Brush", "Nail Trim", "Ear Clean", "Teeth", "Haircut", "Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <Textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="h-16 text-sm" />
        <Button className="w-full" onClick={add}><Scissors className="w-4 h-4 mr-2" /> Log Grooming</Button>
        <div className="space-y-2">
          {records.map(r => (
            <div key={r.id} className="flex justify-between items-center bg-muted/40 rounded-lg px-3 py-2 text-sm">
              <span><strong>{r.type}</strong> · {new Date(r.date).toLocaleDateString()}</span>
              <button onClick={() => { removeGrooming(r.id); reload(); }} className="text-destructive text-xs">Remove</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Vaccinations ──
  function VaccinationPanel() {
    const [records, setRecords] = useState<Vaccination[]>(getVaccinations());
    const [type, setType] = useState<VaccineType>("Rabies"); const [customName, setCustomName] = useState(""); const [given, setGiven] = useState(new Date().toISOString().split("T")[0]); const [due, setDue] = useState(""); const [clinic, setClinic] = useState(""); const [notes, setNotes] = useState("");
    const reload = () => setRecords(getVaccinations());
    const add = () => { if (!due) return; addVaccination({ type, customName, givenDate: given, dueDate: due, clinic, notes }); reload(); setCustomName(""); setClinic(""); setNotes(""); toast({ title: "Vaccination saved" }); };
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Select value={type} onValueChange={v => setType(v as VaccineType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {VACCINE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Clinic" value={clinic} onChange={e => setClinic(e.target.value)} />
        </div>
        {type === "Other" && <Input placeholder="Custom vaccine name" value={customName} onChange={e => setCustomName(e.target.value)} />}
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={given} onChange={e => setGiven(e.target.value)} />
          <Input type="date" placeholder="Due date" value={due} onChange={e => setDue(e.target.value)} />
        </div>
        <Textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="h-16 text-sm" />
        <Button className="w-full" onClick={add}><Stethoscope className="w-4 h-4 mr-2" /> Add Vaccination</Button>
        <div className="space-y-2">
          {records.map(r => {
            const overdue = r.dueDate < new Date().toISOString().split("T")[0];
            return (
              <div key={r.id} className={cn("p-3 rounded-xl border text-sm", overdue ? "border-amber-500/30 bg-amber-500/10" : "border-border/40 bg-muted/40")}>
                <div className="flex justify-between items-start">
                  <div className="font-bold">{vaccinationName(r)}</div>
                  <button onClick={() => { removeVaccination(r.id); reload(); }} className="text-destructive text-xs">Remove</button>
                </div>
                <div className="text-xs text-muted-foreground">Given {r.givenDate} · Due {r.dueDate} {overdue && <span className="font-bold text-amber-600 dark:text-amber-400">OVERDUE</span>}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Vet Info ──
  function VetInfoPanel() {
    const [vet, setVet] = useState<VetInfo>(getVetInfo());
    const [edit, setEdit] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>(vet.contacts || []);
    const [newContact, setNewContact] = useState({ name: "", role: "", phone: "", address: "" });
    const save = () => { const updated = { ...vet, contacts }; updateVetInfo(updated); setVet(updated); setEdit(false); toast({ title: "Vet info saved" }); };
    const addContact = () => { if (!newContact.name) return; const c: Contact = { id: makeId(), ...newContact }; setContacts([...contacts, c]); setNewContact({ name: "", role: "", phone: "", address: "" }); };
    const removeContact = (id: string) => setContacts(contacts.filter(c => c.id !== id));
    const tel = (n?: string) => n ? `tel:${n.replace(/[^\d+\-]/g, "")}` : undefined;
    const map = (a?: string) => a ? `https://maps.google.com/?q=${encodeURIComponent(a)}` : undefined;
    const emailHref = (e?: string) => e ? `mailto:${e}` : undefined;
    return (
      <div className="space-y-4">
        {!edit ? (
          <div className="space-y-3">
            {vet.name && <div className="font-bold text-sm flex items-center gap-2"><Building className="w-4 h-4 text-primary" /> {vet.name}</div>}
            <div className="grid gap-2">
              {vet.phone && <a href={tel(vet.phone)} className="flex items-center gap-2 text-sm bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors"><Phone className="w-4 h-4 text-primary shrink-0" /> <span>{vet.phone}</span></a>}
              {vet.address && <a href={map(vet.address)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors"><MapPin className="w-4 h-4 text-primary shrink-0" /> <span className="leading-tight">{vet.address}</span></a>}
              {vet.email && <a href={emailHref(vet.email)} className="flex items-center gap-2 text-sm bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors"><Mail className="w-4 h-4 text-primary shrink-0" /> <span>{vet.email}</span></a>}
              {vet.emergency && <a href={tel(vet.emergency)} className="flex items-center gap-2 text-sm bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg px-3 py-2 transition-colors"><Phone className="w-4 h-4 shrink-0" /> <span>Emergency: {vet.emergency}</span></a>}
            </div>
            {contacts.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-primary mt-3">Other Important Contacts</div>
                {contacts.map(c => (
                  <div key={c.id} className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
                    <div className="font-bold flex items-center gap-2"><UserCircle className="w-4 h-4 text-primary" /> {c.name} <span className="text-xs font-normal text-muted-foreground">· {c.role}</span></div>
                    {c.phone && <a href={tel(c.phone)} className="flex items-center gap-2 text-xs text-primary hover:underline"><Phone className="w-3 h-3" /> {c.phone}</a>}
                    {c.address && <a href={map(c.address)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline"><MapPin className="w-3 h-3" /> {c.address}</a>}
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => setEdit(true)}><Pencil className="w-4 h-4 mr-2" /> Edit Vet Info</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input placeholder="Vet / Clinic name" value={vet.name} onChange={e => setVet({ ...vet, name: e.target.value })} />
            <Input placeholder="Phone" value={vet.phone} onChange={e => setVet({ ...vet, phone: e.target.value })} />
            <Input placeholder="Address" value={vet.address} onChange={e => setVet({ ...vet, address: e.target.value })} />
            <Input placeholder="Email" value={vet.email} onChange={e => setVet({ ...vet, email: e.target.value })} />
            <Input placeholder="Emergency vet / after-hours" value={vet.emergency} onChange={e => setVet({ ...vet, emergency: e.target.value })} />
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">Add Important Contact</div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Name" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} />
                <Input placeholder="Role (e.g. groomer)" value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} />
              </div>
              <Input placeholder="Phone" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
              <Input placeholder="Address (optional)" value={newContact.address} onChange={e => setNewContact({ ...newContact, address: e.target.value })} />
              <Button variant="outline" className="w-full" onClick={addContact}><Plus className="w-4 h-4 mr-2" /> Add Contact</Button>
              {contacts.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-muted/40 rounded-lg px-3 py-2 text-sm">
                  <span><strong>{c.name}</strong> · {c.role}</span>
                  <button onClick={() => removeContact(c.id)} className="text-destructive text-xs">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setVet(getVetInfo()); setContacts(vet.contacts || []); setEdit(false); }}>Cancel</Button>
              <Button className="flex-1" onClick={save}><Building className="w-4 h-4 mr-2" /> Save</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Training Schedule / Log ──
  function TrainingPanel() {
    const [sessions, setSessions] = useState(getTraining());
    const [skill, setSkill] = useState("Sit"); const [duration, setDuration] = useState("10"); const [date, setDate] = useState(new Date().toISOString().split("T")[0]); const [notes, setNotes] = useState(""); const [success, setSuccess] = useState(3);
    const stats = trainingStats();
    const reload = () => setSessions(getTraining());
    const add = () => {
      addTraining({ skill, durationMin: parseInt(duration) || 0, date, notes, success: success as 1 | 2 | 3 | 4 | 5 });
      reload(); setNotes(""); toast({ title: "Training session logged" });
    };
    const skills = ["Sit", "Stay", "Come", "Heel", "Leave it", "Place", "Crate", "Loose Leash", "Recall", "Trick", "Socialization", "Other"];
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Select value={skill} onValueChange={setSkill}>
            <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {skills.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="min" value={duration} onChange={e => setDuration(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Select value={String(success)} onValueChange={v => setSuccess(Number(v))}>
            <SelectTrigger><SelectValue placeholder="Success" /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}/5</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="h-16 text-sm" />
        <Button className="w-full" onClick={add}><GraduationCap className="w-4 h-4 mr-2" /> Log Training</Button>
        {stats.sessions > 0 && (
          <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
            <div className="font-bold">{stats.sessions} sessions · {stats.totalMin} minutes</div>
            <div className="text-xs text-muted-foreground">Most practiced: {Object.entries(stats.bySkill).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"}</div>
          </div>
        )}
        <div className="space-y-2">
          {sessions.map(t => (
            <div key={t.id} className="flex justify-between items-center bg-muted/40 rounded-lg px-3 py-2 text-sm">
              <span><strong>{t.skill}</strong> · {t.durationMin}m · {t.success}/5</span>
              <button onClick={() => { removeTraining(t.id); reload(); }} className="text-destructive text-xs">Remove</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Shared Access (Dog Walker) ──
  function SharedAccessPanel() {
    const dogId = activeDog?.id;
    if (!dogId) return null;
    const [accesses, setAccesses] = useState(getSharedAccesses(dogId));
    const [name, setName] = useState(""); const [pin, setPin] = useState(""); const [canWalk, setCanWalk] = useState(true); const [canFeed, setCanFeed] = useState(false); const [canView, setCanView] = useState(true);
    const reload = () => setAccesses(getSharedAccesses(dogId));
    const add = () => {
      if (!name || !pin || pin.length < 4) { toast({ title: "PIN must be 4+ digits", variant: "destructive" }); return; }
      addSharedAccess(dogId, { pin, name, canLogWalks: canWalk, canViewProfile: canView, canLogFeeding: canFeed });
      reload(); setName(""); setPin(""); toast({ title: "Shared access created" });
    };
    return (
      <div className="space-y-4">
        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
          Create a limited-access PIN for dog walkers or family members. They can log walks (and optionally feedings) but cannot edit profile, recipes, or medical records.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Walker name" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="4-digit PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm"><span>Log walks</span><Switch checked={canWalk} onCheckedChange={setCanWalk} /></div>
          <div className="flex items-center justify-between text-sm"><span>Log feedings</span><Switch checked={canFeed} onCheckedChange={setCanFeed} /></div>
          <div className="flex items-center justify-between text-sm"><span>View schedule</span><Switch checked={canView} onCheckedChange={setCanView} /></div>
        </div>
        <Button className="w-full" onClick={add}><Share2 className="w-4 h-4 mr-2" /> Create Access</Button>
        <div className="space-y-2">
          {accesses.map(a => (
            <div key={a.pin} className="flex justify-between items-center bg-muted/40 rounded-lg px-3 py-2 text-sm">
              <div>
                <div className="font-bold">{a.name}</div>
                <div className="text-[10px] text-muted-foreground">PIN: {a.pin} · {a.canLogWalks ? "Walks" : ""} {a.canLogFeeding ? "Feed" : ""} {a.canViewProfile ? "View" : ""}</div>
              </div>
              <button onClick={() => { removeSharedAccess(dogId, a.pin); reload(); }} className="text-destructive text-xs">Remove</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Saved Calculations ──
  function CalculationsPanel() {
    const cals = activeDog?.savedCalculations || [];
    const typeNames: Record<string, string> = { rr: "Respiratory Rate", calories: "Calories", chocolate: "Chocolate Toxicity", flea: "Flea/Tick Schedule", exercise: "Exercise Plan", treats: "Treat Budget", cost: "Cost Per Day" };
    return (
      <div className="space-y-2">
        {cals.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">No calculator results saved yet. Use the Health Tools tab and save results.</div>}
        {cals.slice(0, 20).map(c => (
          <div key={c.id} className="bg-muted/40 rounded-lg px-3 py-2 text-sm">
            <div className="flex justify-between items-start">
              <span className="font-bold">{typeNames[c.type] || c.type}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(c.date).toLocaleDateString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">{c.summary}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setView('home')} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif font-bold tracking-tight">Dog Profile</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger value="profile" className="text-[10px] py-1.5"><Dog className="w-3 h-3 mr-1" />Profile</TabsTrigger>
          <TabsTrigger value="health" className="text-[10px] py-1.5"><HeartPulse className="w-3 h-3 mr-1" />Health</TabsTrigger>
          <TabsTrigger value="care" className="text-[10px] py-1.5"><Stethoscope className="w-3 h-3 mr-1" />Care</TabsTrigger>
          <TabsTrigger value="share" className="text-[10px] py-1.5"><Users className="w-3 h-3 mr-1" />Share</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card className="border-none shadow-sm overflow-hidden bg-card relative">
            <div className="h-20 bg-primary/20 absolute top-0 left-0 right-0"></div>
            <CardContent className="pt-10 relative">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full border-4 border-card bg-muted flex items-center justify-center shadow-md relative overflow-hidden">
                  {form.profilePic ? (
                    <img src={form.profilePic} className="w-full h-full object-cover rounded-full" alt="Dog" />
                  ) : (
                    <span className="text-3xl font-serif font-bold text-primary">{form.name.charAt(0)}</span>
                  )}
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
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
                <div className="space-y-2 col-span-2">
                  <Label>Breed</Label>
                  <Input placeholder="e.g. Labrador Mix" value={form.breed || ""} onChange={e => setForm({...form, breed: e.target.value})} onBlur={saveProfile} />
                </div>
                <div className="space-y-2">
                  <Label>Activity</Label>
                  <Select value={form.activityLevel} onValueChange={v => {setForm({...form, activityLevel: v}); updateActiveDog({activityLevel: v as any})}}>
                    <SelectTrigger className="text-left"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="working">Working</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Body Condition</Label>
                  <Select value={form.bodyCondition} onValueChange={v => {setForm({...form, bodyCondition: v}); updateActiveDog({bodyCondition: v as any})}}>
                    <SelectTrigger className="text-left"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="underweight">Underweight</SelectItem>
                      <SelectItem value="optimal">Optimal</SelectItem>
                      <SelectItem value="overweight">Overweight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Health Notes</Label>
                  <Textarea value={form.healthNotes || ""} onChange={e => setForm({...form, healthNotes: e.target.value})} onBlur={saveProfile} placeholder="Allergies, conditions, medications..." className="h-20 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <SectionTitle icon={Calculator} title="Saved Calculator Results" />
              <CalculationsPanel />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <SectionTitle icon={Weight} title="Weight Log" />
              <WeightPanel />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <h3 className="font-serif font-bold text-base mb-4 text-foreground">Favorites for Rotation</h3>
              <ChipSelector title="Proteins" options={PROTEINS} selected={form.favorites.proteins} onChange={(v) => handleFavoriteChange('proteins', v)} />
              <ChipSelector title="Organs" options={ORGANS} selected={form.favorites.organs} onChange={(v) => handleFavoriteChange('organs', v)} />
              <ChipSelector title="Veggies" options={VEGGIES} selected={form.favorites.veggies} onChange={(v) => handleFavoriteChange('veggies', v)} />
              <ChipSelector title="Starches" options={STARCHES} selected={form.favorites.starches} onChange={(v) => handleFavoriteChange('starches', v)} />
              <ChipSelector title="Daily Constants" options={CONSTANTS} selected={form.favorites.dailyConstants} onChange={(v) => handleFavoriteChange('dailyConstants', v)} />
            </CardContent>
          </Card>

          <div className="pt-4 pb-4">
            <div className="border border-destructive/20 bg-destructive/5 rounded-2xl p-4 text-center">
              <h3 className="text-destructive font-bold mb-2">Danger Zone</h3>
              <p className="text-xs text-muted-foreground mb-4">Permanently delete this dog's profile, recipes, and history.</p>
              <Button variant="destructive" className="w-full" onClick={() => setShowDelete(true)}>
                <Trash2 className="w-4 h-4 mr-2" /> Remove {form.name}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4 mt-4">
          <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4">
              <SectionTitle icon={HeartPulse} title="Daily Health Check" />
              <HealthCheckPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="care" className="space-y-4 mt-4">
          <Card className="border-none shadow-sm bg-card"><CardContent className="p-4">
            <SectionTitle icon={Syringe} title="Medications & Reminders" />
            <MedicationPanel />
          </CardContent></Card>
          <Card className="border-none shadow-sm bg-card"><CardContent className="p-4">
            <SectionTitle icon={Stethoscope} title="Vaccination Records" />
            <VaccinationPanel />
          </CardContent></Card>
          <Card className="border-none shadow-sm bg-card"><CardContent className="p-4">
            <SectionTitle icon={Scissors} title="Grooming Log" />
            <GroomingPanel />
          </CardContent></Card>
          <Card className="border-none shadow-sm bg-card"><CardContent className="p-4">
            <SectionTitle icon={Building} title="Vet Information" />
            <VetInfoPanel />
          </CardContent></Card>
          <Card className="border-none shadow-sm bg-card"><CardContent className="p-4">
            <SectionTitle icon={GraduationCap} title="Training Schedule" />
            <TrainingPanel />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-4 mt-4">
          <Card className="border-none shadow-sm bg-card"><CardContent className="p-4">
            <SectionTitle icon={Share2} title="Dog Walker Access" />
            <SharedAccessPanel />
          </CardContent></Card>
        </TabsContent>
      </Tabs>

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
