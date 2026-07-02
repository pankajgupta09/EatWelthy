export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarPublicId?: string;
  isVerified: boolean;
  date: string;
}

export interface Profile {
  _id?: string;
  userId: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number;
  weight: number;
  targetWeight: number;
  dailyBudget: number;
  dietaryPreferences: string;
  allergies: string[];
  activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active";
  dietPlan: "maintenance" | "weight_loss" | "weight_gain" | "muscle_gain";
  profileIcon: string;
  dietSuggestions?: DietMeal[];
  lastDietSuggestionUpdate?: string;
}

export interface DietMeal {
  meal: string;
  items: { food: string; weight: string }[];
}

export interface Food {
  _id: string;
  name: string;
  owner: string;
  energy: number;
  fat: number;
  sugar: number;
  fiber: number;
  protein: number;
  sodium: number;
  vitamin_c: number;
  calcium: number;
  iron: number;
}

export interface Meal {
  _id: string;
  owner: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  food_taken: string;
  portion: number;
  time: string;
}

export interface MealWithNutrition {
  meal: Meal;
  nutrition: Food[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  describe?: string;
}

export interface Supermarket {
  _id: string;
  name: string;
  food_items: SupermarketItem[];
}

export interface SupermarketItem {
  name: string;
  price: number;
  unit: string;
}

export interface ApiError {
  msg?: string;
  errors?: { msg: string }[];
}
