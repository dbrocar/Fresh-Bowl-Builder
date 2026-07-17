// ── CARE MODULE (new health/lifestyle tracking) ───────────────────────────────
// Stored under the active Dog object in freshbowl_v2, plus a few shared keys
// for walk sessions and shared access.

import { loadAppData, updateActiveDog, type Medication, type WeightEntry } from "./storage";

export function makeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ── Health Check (daily) ──
export interface HealthCheck {
  date: string;       // ISO date
  energy: 1 | 2 | 3 | 4 | 5;
  appetite: 1 | 2 | 3 | 4 | 5;
  stool: 1 | 2 | 3 | 4 | 5;
  coat: 1 | 2 | 3 | 4 | 5;
  mood: 1 | 2 | 3 | 4 | 5;
  note?: string;
  score: number;      // average of 5, 1 decimal
}

export function addHealthCheck(check: Omit<HealthCheck, "score">): HealthCheck | null {
  const values = [check.energy, check.appetite, check.stool, check.coat, check.mood];
  const score = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const full: HealthCheck = { ...check, score };
  const data = loadAppData();
  const dog = data.dogs.find(d => d.id === data.activeDogId);
  if (!dog) return null;
  const checks = [...(dog.healthChecks || []), full].slice(-90); // keep 90 days
  updateActiveDog({ healthChecks: checks });
  return full;
}

export function getHealthChecks(): HealthCheck[] {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  return dog?.healthChecks || [];
}

export function latestHealthCheck(): HealthCheck | null {
  const checks = getHealthChecks();
  return checks[checks.length - 1] || null;
}

export function healthAverageForDays(days: number): { score: number; count: number } {
  const checks = getHealthChecks();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recent = checks.filter(c => new Date(c.date) >= cutoff);
  if (!recent.length) return { score: 0, count: 0 };
  return {
    score: Math.round((recent.reduce((s, c) => s + c.score, 0) / recent.length) * 10) / 10,
    count: recent.length,
  };
}

// ── Weight Log ──
export function addWeightEntry(kg: number): WeightEntry {
  const entry: WeightEntry = { id: makeId(), date: new Date().toISOString(), kg };
  const data = loadAppData();
  const dog = data.dogs.find(d => d.id === data.activeDogId);
  const log = [...(dog?.weightLog || []), entry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-60);
  updateActiveDog({ weightLog: log });
  return entry;
}

export function removeWeightEntry(id: string) {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  const log = (dog?.weightLog || []).filter(e => e.id !== id);
  updateActiveDog({ weightLog: log });
}

export function getWeightLog(): WeightEntry[] {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  return dog?.weightLog || [];
}

// ── Medications ──
export function addMedication(med: Omit<Medication, "id">): Medication {
  const full: Medication = { ...med, id: makeId() };
  const data = loadAppData();
  const dog = data.dogs.find(d => d.id === data.activeDogId);
  updateActiveDog({ medications: [...(dog?.medications || []), full] });
  return full;
}

export function removeMedication(id: string) {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  updateActiveDog({ medications: (dog?.medications || []).filter(m => m.id !== id) });
}

export function getMedications(): Medication[] {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  return dog?.medications || [];
}

export function nextDueDate(med: Medication): string {
  const d = new Date(med.lastDate + "T00:00:00");
  d.setDate(d.getDate() + med.frequencyDays);
  return d.toISOString().split("T")[0];
}

export function isOverdue(med: Medication): boolean {
  return nextDueDate(med) < new Date().toISOString().split("T")[0];
}

export function recordMedicationGiven(id: string) {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  const meds = (dog?.medications || []).map(m => m.id === id ? { ...m, lastDate: new Date().toISOString().split("T")[0] } : m);
  updateActiveDog({ medications: meds });
}

// ── Grooming ──
export type GroomType = "Bath" | "Brush" | "Nail Trim" | "Ear Clean" | "Teeth" | "Haircut" | "Other";
export interface GroomingRecord {
  id: string;
  type: GroomType;
  date: string;
  notes?: string;
}

export function addGrooming(record: Omit<GroomingRecord, "id">): GroomingRecord {
  const full: GroomingRecord = { ...record, id: makeId() };
  const data = loadAppData();
  const dog = data.dogs.find(d => d.id === data.activeDogId);
  updateActiveDog({ grooming: [...(dog?.grooming || []), full] });
  return full;
}

export function removeGrooming(id: string) {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  updateActiveDog({ grooming: (dog?.grooming || []).filter(g => g.id !== id) });
}

export function getGrooming(): GroomingRecord[] {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  return (dog?.grooming || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export type VaccineType = "Rabies" | "DHPP/DAPP" | "Bordetella" | "Leptospirosis" | "Lyme" | "Canine Influenza" | "Parvovirus" | "Distemper" | "Hepatitis" | "Other";
export const VACCINE_TYPES: VaccineType[] = ["Rabies", "DHPP/DAPP", "Bordetella", "Leptospirosis", "Lyme", "Canine Influenza", "Parvovirus", "Distemper", "Hepatitis", "Other"];

// ── Vaccinations ──
export interface Vaccination {
  id: string;
  type: VaccineType;
  customName?: string;
  givenDate: string;
  dueDate: string;
  clinic?: string;
  notes?: string;
}

export function vaccinationName(v: Vaccination): string {
  return v.type === "Other" && v.customName ? v.customName : v.type;
}

export function addVaccination(v: Omit<Vaccination, "id">): Vaccination {
  const full: Vaccination = { ...v, id: makeId() };
  const data = loadAppData();
  const dog = data.dogs.find(d => d.id === data.activeDogId);
  updateActiveDog({ vaccinations: [...(dog?.vaccinations || []), full] });
  return full;
}

export function removeVaccination(id: string) {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  updateActiveDog({ vaccinations: (dog?.vaccinations || []).filter(v => v.id !== id) });
}

export function getVaccinations(): Vaccination[] {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  return (dog?.vaccinations || []).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

// ── Contacts (under Vet Info) ──
export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  address: string;
}

// ── Vet Info ──
export interface VetInfo {
  name: string;
  phone: string;
  address: string;
  email: string;
  emergency: string;
  contacts: Contact[];
}

export function getVetInfo(): VetInfo {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  return dog?.vetInfo || { name: "", phone: "", address: "", email: "", emergency: "", contacts: [] };
}

export function updateVetInfo(vetInfo: VetInfo) {
  updateActiveDog({ vetInfo });
}

// ── Training Schedule / Log ──
export type TrainingSkill = "Sit" | "Stay" | "Come" | "Heel" | "Leave it" | "Place" | "Crate" | "Loose Leash" | "Recall" | "Trick" | "Socialization" | "Other";
export type TrainingSuccess = 1 | 2 | 3 | 4 | 5;
export interface TrainingSession {
  id: string;
  date: string;
  skill: TrainingSkill | string;
  durationMin: number;
  notes?: string;
  success: TrainingSuccess;
}

export function addTraining(session: Omit<TrainingSession, "id">): TrainingSession {
  const full: TrainingSession = { ...session, id: makeId() };
  const data = loadAppData();
  const dog = data.dogs.find(d => d.id === data.activeDogId);
  updateActiveDog({ training: [...(dog?.training || []), full] });
  return full;
}

export function removeTraining(id: string) {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  updateActiveDog({ training: (dog?.training || []).filter(t => t.id !== id) });
}

export function getTraining(): TrainingSession[] {
  const dog = loadAppData().dogs.find(d => d.id === loadAppData().activeDogId);
  return (dog?.training || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function trainingStats(): { totalMin: number; sessions: number; bySkill: Record<string, number> } {
  const sessions = getTraining();
  const totalMin = sessions.reduce((s, t) => s + t.durationMin, 0);
  const bySkill: Record<string, number> = {};
  sessions.forEach(t => { bySkill[t.skill] = (bySkill[t.skill] || 0) + 1; });
  return { totalMin, sessions: sessions.length, bySkill };
}

// ── Walks (stored in localStorage, keyed by dog) ──
export interface WalkPoint {
  lat: number;
  lng: number;
  ts: number;
  acc?: number;
}

export interface Walk {
  id: string;
  dogId: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationSec: number;
  distanceMiles: number;
  distanceKm: number;
  points: WalkPoint[];
  walker?: string; // if shared access
}

export function saveWalk(walk: Walk) {
  const key = `fb_walks_${walk.dogId}`;
  const all = JSON.parse(localStorage.getItem(key) || "[]") as Walk[];
  const idx = all.findIndex(w => w.id === walk.id);
  if (idx >= 0) all[idx] = walk; else all.push(walk);
  all.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  localStorage.setItem(key, JSON.stringify(all));
}

export function getWalks(dogId: string): Walk[] {
  return JSON.parse(localStorage.getItem(`fb_walks_${dogId}`) || "[]") as Walk[];
}

export function deleteWalk(id: string, dogId: string) {
  const key = `fb_walks_${dogId}`;
  const all = (JSON.parse(localStorage.getItem(key) || "[]") as Walk[]).filter(w => w.id !== id);
  localStorage.setItem(key, JSON.stringify(all));
}

export function totalWalkStats(dogId: string, days = 30): { count: number; miles: number; minutes: number } {
  const cutoff = Date.now() - days * 86400000;
  const walks = getWalks(dogId).filter(w => new Date(w.startTime).getTime() >= cutoff);
  return {
    count: walks.length,
    miles: Math.round(walks.reduce((s, w) => s + w.distanceMiles, 0) * 100) / 100,
    minutes: Math.round(walks.reduce((s, w) => s + w.durationSec, 0) / 60),
  };
}

export function allTimeWalkStats(dogId: string): { count: number; miles: number; minutes: number } {
  const walks = getWalks(dogId);
  return {
    count: walks.length,
    miles: Math.round(walks.reduce((s, w) => s + w.distanceMiles, 0) * 100) / 100,
    minutes: Math.round(walks.reduce((s, w) => s + w.durationSec, 0) / 60),
  };
}

export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Shared Access (dog walker) ──
export interface SharedAccess {
  pin: string;
  name: string;
  canLogWalks: boolean;
  canViewProfile: boolean;
  canLogFeeding: boolean;
  createdAt: string;
}

export function getSharedAccesses(dogId: string): SharedAccess[] {
  return JSON.parse(localStorage.getItem(`fb_shared_${dogId}`) || "[]") as SharedAccess[];
}

export function addSharedAccess(dogId: string, access: Omit<SharedAccess, "createdAt">): SharedAccess {
  const full: SharedAccess = { ...access, createdAt: new Date().toISOString() };
  const all = [...getSharedAccesses(dogId), full];
  localStorage.setItem(`fb_shared_${dogId}`, JSON.stringify(all));
  return full;
}

export function removeSharedAccess(dogId: string, pin: string) {
  const all = getSharedAccesses(dogId).filter(a => a.pin !== pin);
  localStorage.setItem(`fb_shared_${dogId}`, JSON.stringify(all));
}

export function validateSharedAccess(dogId: string, pin: string): SharedAccess | null {
  return getSharedAccesses(dogId).find(a => a.pin === pin) || null;
}

export function storeWalkerSession(dogId: string, pin: string) {
  localStorage.setItem("fb_walker_session", JSON.stringify({ dogId, pin, at: new Date().toISOString() }));
}

export function clearWalkerSession() {
  localStorage.removeItem("fb_walker_session");
}

export function getWalkerSession(): { dogId: string; pin: string } | null {
  try { return JSON.parse(localStorage.getItem("fb_walker_session") || "null"); } catch { return null; }
}
