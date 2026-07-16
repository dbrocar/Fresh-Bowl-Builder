import { Dog, FeedingRotation, DayMeal } from "./storage";

export function calculateMER(weightKg: number, activityLevel: string, condition: string, ageMonths: number, neutered: boolean): number {
  // RER = 70 * (weightKg ^ 0.75)
  const rer = 70 * Math.pow(weightKg, 0.75);
  
  let activityFactor = 1.6; // default moderate
  if (activityLevel === 'low') activityFactor = 1.3;
  if (activityLevel === 'high') activityFactor = 2.0;
  if (activityLevel === 'working') activityFactor = 3.0;

  let conditionFactor = 1.0;
  if (condition === 'underweight') conditionFactor = 1.2;
  if (condition === 'overweight') conditionFactor = 0.85;

  let ageFactor = 1.0;
  if (ageMonths < 4) ageFactor = 3.0;
  else if (ageMonths < 12) ageFactor = 2.0;
  else if (ageMonths > 84) ageFactor = 0.8; // Senior
  
  let neuterFactor = neutered ? 1.0 : 1.2;
  if (ageMonths < 12) neuterFactor = 1.0; // Puppies use age factor primarily

  return Math.round(rer * activityFactor * conditionFactor * ageFactor * neuterFactor);
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function generateRotation(dog: Dog): FeedingRotation {
  const mer = calculateMER(dog.weightKg, dog.activityLevel, dog.bodyCondition, dog.ageMonths, dog.neutered);
  const treatBudget = Math.round(mer * 0.1);
  const foodKcal = mer - treatBudget;
  
  // Approximate 1.2 kcal/g for mixed fresh food as a general base.
  // Breakdown: 70% protein, 10% organ, 12% veggie, 8% starch
  const breakdown = {
    proteinPct: 70,
    organPct: 10,
    veggiePct: 12,
    starchPct: 8
  };
  
  const hasStarches = dog.favorites.starches.length > 0;
  if (!hasStarches) {
    breakdown.veggiePct += 8;
    breakdown.starchPct = 0;
  }
  
  const weeklyMeals: DayMeal[] = DAYS.map((day, idx) => {
    const protein = dog.favorites.proteins.length > 0 ? dog.favorites.proteins[idx % dog.favorites.proteins.length] : "Default Protein";
    const organ = dog.favorites.organs.length > 0 ? dog.favorites.organs[idx % dog.favorites.organs.length] : "Default Organ";
    const veggie = dog.favorites.veggies.length > 0 ? dog.favorites.veggies[idx % dog.favorites.veggies.length] : "Default Veggie";
    const starch = hasStarches ? dog.favorites.starches[idx % dog.favorites.starches.length] : "";
    
    // Distribute total daily food grams. (~1.2 kcal/g average)
    const gramsTotal = Math.round(foodKcal / 1.2);
    
    return {
      day,
      protein,
      organ,
      veggie,
      starch,
      constants: dog.favorites.dailyConstants.length > 0 ? [...dog.favorites.dailyConstants] : ["Fish Oil"],
      gramsTotal,
      kcal: foodKcal
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    dailyKcal: foodKcal,
    breakdown,
    weeklyMeals,
    treatBudgetKcal: treatBudget
  };
}
