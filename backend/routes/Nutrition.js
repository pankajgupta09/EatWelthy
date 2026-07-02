
const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middlewares/auth");
const Nutrition_data = require("../models/Nutrition_data");
const Meal_data = require("../models/Meal_data");

// Fetch nutrition from Nutritionix (primary — requires creds)
async function fetchFromNutritionix(foodName) {
  if (!process.env.NUTRITIONIX_ID || !process.env.NUTRITIONIX_KEY) return null;
  try {
    const response = await axios.post(
      "https://trackapi.nutritionix.com/v2/natural/nutrients",
      { query: foodName },
      {
        headers: {
          "x-app-id": process.env.NUTRITIONIX_ID,
          "x-app-key": process.env.NUTRITIONIX_KEY,
          "Content-Type": "application/json",
        },
        timeout: 8000,
      }
    );

    const food = response.data.foods?.[0];
    if (!food) return null;

    // Nutritionix returns absolute values for the serving — normalize to /100g
    const grams = food.serving_weight_grams || 100;
    const factor = 100 / grams;

    return {
      energy: (food.nf_calories || 0) * factor,
      fat: (food.nf_total_fat || 0) * factor,
      sugar: (food.nf_sugars || 0) * factor,
      fiber: (food.nf_dietary_fiber || 0) * factor,
      protein: (food.nf_protein || 0) * factor,
      sodium: (food.nf_sodium || 0) * factor,
      vitamin_c: 0,
      calcium: 0,
      iron: 0,
    };
  } catch (err) {
    console.error("Nutritionix error:", err.message);
    return null;
  }
}

// Fetch nutrition from Open Food Facts (fallback — no key needed)
async function fetchFromOpenFoodFacts(foodName) {
  try {
    const response = await axios.get(
      "https://world.openfoodfacts.org/cgi/search.pl",
      {
        params: {
          search_terms: foodName,
          json: 1,
          page_size: 10,
          fields: "product_name,nutriments,lang",
          sort_by: "unique_scans_n",
          lc: "en",
        },
        timeout: 8000,
      }
    );

    const products = response.data.products || [];
    // Prefer English-language products with nutriment data
    const product =
      products.find((p) => p.lang === "en" && p.product_name && p.nutriments) ||
      products.find((p) => p.product_name && p.nutriments) ||
      products[0];
    if (!product) return null;

    const n = product.nutriments;
    return {
      energy: n["energy-kcal_100g"] || 0,
      fat: n["fat_100g"] || 0,
      sugar: n["sugars_100g"] || 0,
      fiber: n["fiber_100g"] || 0,
      protein: n["proteins_100g"] || 0,
      sodium: (n["sodium_100g"] || 0) * 1000,
      vitamin_c: n["vitamin-c_100g"] || 0,
      calcium: n["calcium_100g"] || 0,
      iron: n["iron_100g"] || 0,
    };
  } catch (err) {
    console.error("Open Food Facts error:", err.message);
    return null;
  }
}

// Try Nutritionix first, fall back to Open Food Facts
async function fetchNutrition(foodName) {
  const fromNx = await fetchFromNutritionix(foodName);
  if (fromNx) return fromNx;
  return fetchFromOpenFoodFacts(foodName);
}

// POST /nutrition/add — add a custom food to the user's nutrition DB
router.post("/add", auth, async (req, res) => {
  try {
    let { name, owner, energy, fat, sugar, fiber, protein, sodium, vitamin_c, calcium, iron } = req.body;

    if (!name || !energy) {
      return res.status(400).json({ msg: "Name and Energy are required fields" });
    }

    const hashedOwner = Nutrition_data.hashedOwner(owner);

    const existingFood = await Nutrition_data.findOne({
      owner: { $in: ["admin", hashedOwner] },
      name: new RegExp(`^${name}$`, "i"),
    });

    if (existingFood) {
      return res.status(400).json({ msg: "Food already exists in your list" });
    }

    const nutrition = new Nutrition_data({
      name,
      owner: hashedOwner,
      energy,
      fat: fat || 0,
      sugar: sugar || 0,
      fiber: fiber || 0,
      protein: protein || 0,
      sodium: sodium || 0,
      vitamin_c: vitamin_c || 0,
      calcium: calcium || 0,
      iron: iron || 0,
    });

    await nutrition.save();
    res.status(200).json(nutrition);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// POST /nutrition/query_food — get foods for a user (user-owned + admin shared)
router.post("/query_food", auth, async (req, res) => {
  try {
    const hashedOwner = Nutrition_data.hashedOwner(req.body.owner);
    const foodSaved = await Nutrition_data.find({
      owner: { $in: ["admin", hashedOwner] },
    }).sort({ name: 1 });

    res.status(200).json({ success: true, food_saved: foodSaved });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// PUT /nutrition/update/:id — update a food item
router.put("/update/:id", auth, async (req, res) => {
  try {
    const { owner, energy, fat, sugar, fiber, protein, sodium, vitamin_c, calcium, iron } = req.body;

    let food = await Nutrition_data.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ msg: "Food not found" });
    }

    const hashedOwner = Nutrition_data.hashedOwner(owner);
    if (food.owner !== hashedOwner) {
      return res.status(401).json({ msg: "Not authorized to update this food" });
    }

    food = await Nutrition_data.findByIdAndUpdate(
      req.params.id,
      { $set: { energy, fat, sugar, fiber, protein, sodium, vitamin_c, calcium, iron } },
      { new: true }
    );

    res.json(food);
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

// POST /nutrition/log_meal — log a meal for a user
router.post("/log_meal", auth, async (req, res) => {
  try {
    let { owner, meal_type, food_taken, portion, time } = req.body;

    const hashedOwner = Meal_data.hashedOwner(owner);

    // Check local DB first (admin or user's own food)
    const localFood = await Nutrition_data.findOne({
      owner: { $in: ["admin", hashedOwner] },
      name: new RegExp(`^${food_taken}$`, "i"),
    });

    if (!localFood) {
      // Fall back to external nutrition API (Nutritionix → Open Food Facts)
      const apiFood = await fetchNutrition(food_taken);

      if (!apiFood) {
        return res.status(400).json({ msg: "Food not found in database or external nutrition APIs. Add it manually via 'Customised Food'." });
      }

      // Store nutrition under the user's typed name (not the API's foreign-language product name)
      const alreadyExists = await Nutrition_data.findOne({
        name: new RegExp(`^${food_taken}$`, "i"),
        owner: "admin",
      });
      if (!alreadyExists) {
        const newNutrition = new Nutrition_data({
          name: food_taken,
          owner: "admin",
          energy: apiFood.energy,
          fat: apiFood.fat,
          sugar: apiFood.sugar,
          fiber: apiFood.fiber,
          protein: apiFood.protein,
          sodium: apiFood.sodium,
          vitamin_c: apiFood.vitamin_c,
          calcium: apiFood.calcium,
          iron: apiFood.iron,
        });
        await newNutrition.save();
      }
    }

    const mealData = new Meal_data({
      owner: hashedOwner,
      meal_type,
      food_taken,
      portion,
      time,
    });

    await mealData.save();
    res.status(200).send("Added successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// POST /nutrition/query_meal — query meals for a user by date and optional meal type
router.post("/query_meal", auth, async (req, res) => {
  try {
    const { meal_type, time, owner } = req.body;

    const date = new Date(time);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const hashedOwner = Meal_data.hashedOwner(owner);

    const baseQuery = {
      owner: hashedOwner,
      time: { $gte: startOfDay, $lt: endOfDay },
    };

    const meals = await Meal_data.find(
      meal_type ? { ...baseQuery, meal_type } : baseQuery
    ).sort({ meal_type: 1 });

    if (meals.length === 0) {
      return res.status(200).json({ success: true, meals: [] });
    }

    const mealsWithNutrition = await Promise.all(
      meals.map(async (meal) => {
        const nutritionData = await Nutrition_data.find({
          owner: { $in: ["admin", hashedOwner] },
          name: new RegExp(`^${meal.food_taken}$`, "i"),
        });
        return { meal, nutrition: nutritionData };
      })
    );

    res.status(200).json({ success: true, meals: mealsWithNutrition });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// DELETE /nutrition/delete/:id — delete a food from nutrition DB
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    await Nutrition_data.deleteOne({ _id: req.params.id });
    res.status(204).send();
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// DELETE /nutrition/meal_delete/:id — delete a logged meal
router.delete("/meal_delete/:id", auth, async (req, res) => {
  try {
    await Meal_data.deleteOne({ _id: req.params.id });
    res.status(204).send();
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// PUT /nutrition/meal_update/:id — update a logged meal
router.put("/meal_update/:id", auth, async (req, res) => {
  try {
    const { owner, meal_type, food_taken, portion } = req.body;

    let meal = await Meal_data.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({ msg: "Meal not found" });
    }

    const hashedOwner = Meal_data.hashedOwner(owner);
    if (meal.owner !== hashedOwner) {
      return res.status(401).json({ msg: "Not authorized to update this meal" });
    }

    meal = await Meal_data.findByIdAndUpdate(
      req.params.id,
      { $set: { meal_type, food_taken, portion } },
      { new: true }
    );

    res.json({ success: true, meal });
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

// GET /nutrition/nutrition_data — admin: get all nutrition data
router.get("/nutrition_data", auth, async (req, res) => {
  try {
    const nutritionData = await Nutrition_data.find({ owner: "admin" });
    res.status(200).json({ success: true, data: nutritionData });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
