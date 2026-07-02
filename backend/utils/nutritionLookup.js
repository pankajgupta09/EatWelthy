const axios = require("axios");
const Nutrition_data = require("../models/Nutrition_data");
const { findFallbackFood } = require("./nutritionFallback");

const getNutritionixConfig = () => ({
  headers: {
    "x-app-id": process.env.NUTRITIONIX_ID,
    "x-app-key": process.env.NUTRITIONIX_KEY,
    "Content-Type": "application/json",
  },
});

const hasNutritionixCredentials = () =>
  Boolean(process.env.NUTRITIONIX_ID && process.env.NUTRITIONIX_KEY);

const parseNutritionixFood = (apiFood) => {
  let sodium = 0;
  let vitamin_c = 0;
  let calcium = 0;
  let iron = 0;

  for (const nutrient of apiFood.full_nutrients || []) {
    if (nutrient.attr_id === 307) sodium = nutrient.value;
    if (nutrient.attr_id === 401) vitamin_c = nutrient.value;
    if (nutrient.attr_id === 301) calcium = nutrient.value;
    if (nutrient.attr_id === 303) iron = nutrient.value;
  }

  return {
    name: apiFood.food_name,
    owner: "admin",
    energy: apiFood.nf_calories || 0,
    fat: apiFood.nf_total_fat || 0,
    sugar: apiFood.nf_sugars || 0,
    fiber: apiFood.nf_dietary_fiber || 0,
    protein: apiFood.nf_protein || 0,
    sodium,
    vitamin_c,
    calcium,
    iron,
  };
};

const fetchFromNutritionix = async (foodName) => {
  if (!hasNutritionixCredentials()) {
    return null;
  }

  try {
    const response = await axios.post(
      "https://trackapi.nutritionix.com/v2/natural/nutrients",
      { query: foodName },
      getNutritionixConfig()
    );

    if (response.status === 200 && response.data?.foods?.[0]) {
      return parseNutritionixFood(response.data.foods[0]);
    }
  } catch (error) {
    const status = error.response?.status;
    console.error(
      `Nutritionix API error for "${foodName}":`,
      status || error.message
    );
    if (status === 401) {
      console.error(
        "Nutritionix credentials are invalid or expired. Using local fallback when available."
      );
    }
  }

  return null;
};

const saveNutritionRecord = async (nutritionData) => {
  const existing = await Nutrition_data.findOne({
    name: new RegExp(`^${nutritionData.name}$`, "i"),
    owner: "admin",
  });

  if (existing) {
    return existing;
  }

  const nutrition = new Nutrition_data(nutritionData);
  await nutrition.save();
  return nutrition;
};

const resolveNutritionForFood = async (foodName) => {
  const hashedGuestQuery = {
    $and: [
      { $or: [{ owner: "admin" }] },
      { name: new RegExp(`^${foodName}$`, "i") },
    ],
  };

  const existing = await Nutrition_data.find(hashedGuestQuery);
  if (existing.length > 0) {
    return existing;
  }

  let nutritionData = await fetchFromNutritionix(foodName);

  if (!nutritionData) {
    const fallback = findFallbackFood(foodName);
    if (fallback) {
      console.log(`Using local fallback nutrition for "${foodName}"`);
      nutritionData = { ...fallback, owner: "admin" };
    }
  }

  if (!nutritionData) {
    return [];
  }

  const saved = await saveNutritionRecord(nutritionData);
  return [saved];
};

module.exports = {
  resolveNutritionForFood,
  fetchFromNutritionix,
  hasNutritionixCredentials,
};
