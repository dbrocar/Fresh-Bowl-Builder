import { z } from "zod";

export type CustomItemCategory = 'protein' | 'organ' | 'veggie' | 'starch' | 'constant' | 'treat';

export interface CustomItem {
  id: string;
  name: string;
  category: CustomItemCategory;
  kcalPer100g: number;
  notes?: string;
  addedCount: number;
}

export interface DayMeal {
  day: string;
  protein: string;
  organ: string;
  veggie: string;
  starch: string;
  constants: string[];
  gramsTotal: number;
  kcal: number;
}

export interface FeedingRotation {
  generatedAt: string;
  dailyKcal: number;
  breakdown: {
    proteinPct: number;
    organPct: number;
    veggiePct: number;
    starchPct: number;
  };
  weeklyMeals: DayMeal[];
  treatBudgetKcal: number;
}

export type CalcType = 'rr' | 'calories' | 'chocolate' | 'flea' | 'exercise' | 'treats' | 'cost';

export interface SavedCalculation {
  id: string;
  type: CalcType;
  date: string;
  summary: string;
  data: Record<string, unknown>;
}

export interface Medication {
  id: string;
  name: string;
  lastDate: string;
  frequencyDays: number;
  nextDates: string[];
}

export interface WeightEntry {
  id: string;
  date: string;
  kg: number;
}

export interface HealthEvent {
  id: string;
  date: string;
  type: string;
  note: string;
}

export interface Favorites {
  proteins: string[];
  organs: string[];
  veggies: string[];
  starches: string[];
  dailyConstants: string[];
}

export interface Dog {
  id: string;
  name: string;
  profilePic?: string;
  breed?: string;
  weightKg: number;
  ageMonths: number;
  sex: 'male' | 'female';
  neutered: boolean;
  activityLevel: 'low' | 'moderate' | 'high' | 'working';
  bodyCondition: 'underweight' | 'optimal' | 'overweight';
  healthNotes?: string;
  
  favorites: Favorites;
  customItems: CustomItem[];
  currentRotation?: FeedingRotation;
  
  weightLog: WeightEntry[];
  healthEvents: HealthEvent[];
  savedCalculations: SavedCalculation[];
  medications: Medication[];
}

export interface AppData {
  dogs: Dog[];
  activeDogId: string | null;
}

const STORAGE_KEY = "freshbowl_v2";

export function loadAppData(): AppData {
  if (typeof window === "undefined") return { dogs: [], activeDogId: null };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { dogs: [], activeDogId: null };
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { dogs: [], activeDogId: null };
  }
}

export function saveAppData(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getActiveDog(): Dog | null {
  const data = loadAppData();
  if (!data.activeDogId) return null;
  return data.dogs.find((d) => d.id === data.activeDogId) || null;
}

export function updateActiveDog(updates: Partial<Dog>): Dog | null {
  const data = loadAppData();
  if (!data.activeDogId) return null;
  
  const dogIndex = data.dogs.findIndex(d => d.id === data.activeDogId);
  if (dogIndex === -1) return null;
  
  const updatedDog = { ...data.dogs[dogIndex], ...updates };
  data.dogs[dogIndex] = updatedDog;
  saveAppData(data);
  return updatedDog;
}

export function addDog(dog: Omit<Dog, "id" | "favorites" | "customItems" | "weightLog" | "healthEvents" | "savedCalculations" | "medications">): Dog {
  const data = loadAppData();
  const newDog: Dog = {
    ...dog,
    id: crypto.randomUUID(),
    favorites: { proteins: [], organs: [], veggies: [], starches: [], dailyConstants: [] },
    customItems: [],
    weightLog: [],
    healthEvents: [],
    savedCalculations: [],
    medications: []
  };
  
  if (newDog.weightKg > 0) {
    newDog.weightLog.push({ id: crypto.randomUUID(), date: new Date().toISOString(), kg: newDog.weightKg });
  }

  data.dogs.push(newDog);
  data.activeDogId = newDog.id;
  saveAppData(data);
  return newDog;
}

export function deleteDog(id: string): void {
  const data = loadAppData();
  data.dogs = data.dogs.filter(d => d.id !== id);
  if (data.activeDogId === id) {
    data.activeDogId = data.dogs.length > 0 ? data.dogs[0].id : null;
  }
  saveAppData(data);
}

export function saveCalculationForActiveDog(
  type: CalcType,
  summary: string,
  data: Record<string, unknown>
): SavedCalculation | null {
  const appData = loadAppData();
  if (!appData.activeDogId) return null;
  const dogIndex = appData.dogs.findIndex(d => d.id === appData.activeDogId);
  if (dogIndex === -1) return null;
  const calc: SavedCalculation = {
    id: crypto.randomUUID(),
    type,
    date: new Date().toISOString(),
    summary,
    data
  };
  appData.dogs[dogIndex].savedCalculations = [calc, ...(appData.dogs[dogIndex].savedCalculations || [])].slice(0, 50);
  saveAppData(appData);
  return calc;
}

export function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
}
