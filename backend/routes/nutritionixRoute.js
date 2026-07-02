const express = require("express");
const axios = require("axios");
const auth = require("../middlewares/auth");

const router = express.Router();

// Primary: Nutritionix natural-language nutrients endpoint (requires creds)
async function searchFromNutritionix(query) {
  if (!process.env.NUTRITIONIX_ID || !process.env.NUTRITIONIX_KEY) return null;
  try {
    const response = await axios.post(
      "https://trackapi.nutritionix.com/v2/natural/nutrients",
      { query },
      {
        headers: {
          "x-app-id": process.env.NUTRITIONIX_ID,
          "x-app-key": process.env.NUTRITIONIX_KEY,
          "Content-Type": "application/json",
        },
        timeout: 8000,
      }
    );

    const foods = response.data.foods || [];
    if (foods.length === 0) return null;

    return {
      foods: foods.map((f) => ({
        food_name: f.food_name || query,
        nf_calories: f.nf_calories || 0,
        nf_total_fat: f.nf_total_fat || 0,
        nf_sugars: f.nf_sugars || 0,
        nf_dietary_fiber: f.nf_dietary_fiber || 0,
        nf_protein: f.nf_protein || 0,
        serving_qty: f.serving_qty || 100,
        serving_unit: f.serving_unit || "g",
      })),
    };
  } catch (err) {
    console.error("Nutritionix error:", err.message);
    return null;
  }
}

// Fallback: Open Food Facts (free, no key)
async function searchFromOpenFoodFacts(query) {
  try {
    const response = await axios.get(
      "https://world.openfoodfacts.org/cgi/search.pl",
      {
        params: {
          search_terms: query,
          json: 1,
          page_size: 10,
          fields: "product_name,nutriments,serving_size,lang",
          sort_by: "unique_scans_n",
          lc: "en",
        },
        timeout: 8000,
      }
    );

    const products = response.data.products || [];
    const product =
      products.find((p) => p.lang === "en" && p.product_name && p.nutriments) ||
      products.find((p) => p.product_name && p.nutriments) ||
      products[0];

    if (!product) return null;

    const n = product.nutriments;
    return {
      foods: [
        {
          food_name: query,
          nf_calories: n["energy-kcal_100g"] || (n["energy_100g"] || 0) / 4.184,
          nf_total_fat: n["fat_100g"] || 0,
          nf_sugars: n["sugars_100g"] || 0,
          nf_dietary_fiber: n["fiber_100g"] || 0,
          nf_protein: n["proteins_100g"] || 0,
          serving_qty: 100,
          serving_unit: "g",
        },
      ],
    };
  } catch (err) {
    console.error("Open Food Facts error:", err.message);
    return null;
  }
}

async function searchFood(query) {
  const fromNx = await searchFromNutritionix(query);
  if (fromNx) return fromNx;
  return searchFromOpenFoodFacts(query);
}

router.post("/nutrition", auth, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Query is required" });
    }

    const result = await searchFood(query.trim());

    if (!result) {
      return res.status(404).json({ error: "Food not found" });
    }

    res.json({ foods: result.foods });
  } catch (error) {
    console.error("Food search error:", error.message);
    res.status(500).json({ error: "Failed to fetch nutrition data" });
  }
});

module.exports = router;
module.exports.searchFood = searchFood;
