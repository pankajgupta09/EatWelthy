const STORAGE_KEY = "eatwelthy_guest_profile";

export const defaultGuestProfile = {
  name: "Guest",
  age: 0,
  gender: "",
  height: 0,
  weight: 0,
  targetWeight: 0,
  dailyBudget: 0,
  dietaryPreferences: "",
  allergies: [],
  activityLevel: "sedentary",
  dietPlan: "maintenance",
  profileIcon: "bear",
};

export const getGuestProfile = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...defaultGuestProfile };
    return { ...defaultGuestProfile, ...JSON.parse(stored) };
  } catch {
    return { ...defaultGuestProfile };
  }
};

export const saveGuestProfile = (profile) => {
  const merged = { ...defaultGuestProfile, ...profile };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
};

export const clearGuestProfile = () => {
  localStorage.removeItem(STORAGE_KEY);
};
