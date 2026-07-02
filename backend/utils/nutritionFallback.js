// Per-serving fallback values when Nutritionix is unavailable
const FALLBACK_FOODS = {
  bread: { energy: 79, fat: 1, sugar: 1.4, fiber: 0.8, protein: 2.7, sodium: 149, vitamin_c: 0, calcium: 36, iron: 0.9 },
  rice: { energy: 206, fat: 0.4, sugar: 0.1, fiber: 0.6, protein: 4.3, sodium: 2, vitamin_c: 0, calcium: 16, iron: 0.2 },
  chicken: { energy: 239, fat: 13.6, sugar: 0, fiber: 0, protein: 27.3, sodium: 82, vitamin_c: 0, calcium: 15, iron: 1.3 },
  egg: { energy: 78, fat: 5.3, sugar: 0.6, fiber: 0, protein: 6.3, sodium: 62, vitamin_c: 0, calcium: 25, iron: 0.9 },
  apple: { energy: 95, fat: 0.3, sugar: 19, fiber: 4.4, protein: 0.5, sodium: 2, vitamin_c: 8.4, calcium: 11, iron: 0.2 },
  banana: { energy: 105, fat: 0.4, sugar: 14.4, fiber: 3.1, protein: 1.3, sodium: 1, vitamin_c: 10.3, calcium: 6, iron: 0.3 },
  milk: { energy: 103, fat: 2.4, sugar: 12, fiber: 0, protein: 8, sodium: 107, vitamin_c: 0, calcium: 276, iron: 0.1 },
  pasta: { energy: 220, fat: 1.3, sugar: 0.8, fiber: 2.5, protein: 8.1, sodium: 1, vitamin_c: 0, calcium: 10, iron: 1.8 },
  potato: { energy: 161, fat: 0.2, sugar: 1.2, fiber: 3.8, protein: 4.3, sodium: 17, vitamin_c: 16.6, calcium: 26, iron: 1.8 },
  salad: { energy: 33, fat: 0.2, sugar: 2.3, fiber: 2, protein: 2.9, sodium: 28, vitamin_c: 9.2, calcium: 37, iron: 0.9 },
  oatmeal: { energy: 158, fat: 3.2, sugar: 0.6, fiber: 4, protein: 5.5, sodium: 115, vitamin_c: 0, calcium: 187, iron: 2.1 },
  yogurt: { energy: 100, fat: 0.4, sugar: 7, fiber: 0, protein: 17, sodium: 61, vitamin_c: 0, calcium: 183, iron: 0.1 },
  beef: { energy: 250, fat: 15, sugar: 0, fiber: 0, protein: 26, sodium: 72, vitamin_c: 0, calcium: 18, iron: 2.6 },
  fish: { energy: 206, fat: 12, sugar: 0, fiber: 0, protein: 22, sodium: 61, vitamin_c: 0, calcium: 12, iron: 0.5 },
  cheese: { energy: 113, fat: 9.3, sugar: 0.1, fiber: 0, protein: 7, sodium: 174, vitamin_c: 0, calcium: 202, iron: 0.1 },
};

const normalizeFoodName = (name) => name.toLowerCase().trim();

const findFallbackFood = (foodName) => {
  const normalized = normalizeFoodName(foodName);
  if (FALLBACK_FOODS[normalized]) {
    return { name: normalized, ...FALLBACK_FOODS[normalized] };
  }

  const match = Object.keys(FALLBACK_FOODS).find(
    (key) => normalized.includes(key) || key.includes(normalized)
  );

  if (match) {
    return { name: match, ...FALLBACK_FOODS[match] };
  }

  return null;
};

module.exports = { findFallbackFood, FALLBACK_FOODS };
