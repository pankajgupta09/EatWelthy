const express = require("express");
const router = express.Router();
const { scrapeBigBasket } = require("../bigBasketScraper");
const Supermarket = require("../models/Supermarket");
const auth = require("../middlewares/auth");
const { scrapeLimiter } = require("../middlewares/rateLimiter");

router.post("/bigbasket", auth, scrapeLimiter, async (req, res) => {
  try {
    const scrapedProducts = await scrapeBigBasket();

    let supermarket = await Supermarket.findOne({ name: "BigBasket" });

    if (!supermarket) {
      supermarket = new Supermarket({ name: "BigBasket", food_items: scrapedProducts });
    } else {
      supermarket.food_items = scrapedProducts;
    }

    await supermarket.save();
    res.json({ message: "Scraping completed and data saved", count: scrapedProducts.length });
  } catch (error) {
    console.error("Error in scraping route:", error.message);
    res.status(500).json({ error: "An error occurred during scraping" });
  }
});

module.exports = router;
