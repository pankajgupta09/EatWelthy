const express = require("express");
const locationRouter = express.Router();
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// Indian grocery/supermarket chains to filter for
const INDIAN_GROCERY_CHAINS = [
  "reliance fresh",
  "reliance smart",
  "dmart",
  "d-mart",
  "more supermarket",
  "more megamart",
  "big bazaar",
  "star bazaar",
  "hypercity",
  "spencers",
  "spencer's",
  "spar",
  "lulu",
  "nature's basket",
  "foodhall",
  "easyday",
  "nilgiris",
  "metro cash",
  "jio mart",
  "jiomart",
];

locationRouter.post("/", async (req, res) => {
  const location = req.body;
  const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?";

  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${url}location=${location.lat},${location.lng}&radius=2000&type=supermarket&key=${process.env.GOOGLE_MAPS_API_KEY}`,
    headers: {},
  };

  try {
    const response = await axios.request(config);

    const filteredResult = response.data.results.filter((item) => {
      const nameLower = item.name.toLowerCase();
      return INDIAN_GROCERY_CHAINS.some((chain) => nameLower.includes(chain));
    });

    // If no known chains found nearby, return top results unfiltered so map isn't empty
    const result = filteredResult.length > 0 ? filteredResult : response.data.results.slice(0, 10);

    return res.status(200).json(result);
  } catch (e) {
    console.error("Location API error:", e.message);
    return res.status(500).json({ error: "Failed to fetch nearby stores" });
  }
});

module.exports = locationRouter;
