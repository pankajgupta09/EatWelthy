const cron = require("node-cron");
const { scrapeBigBasket } = require("./bigBasketScraper");
const Supermarket = require("./models/Supermarket");

function setupScheduledTasks() {
  // Run every day at 2:30 AM
  cron.schedule("30 2 * * *", async () => {
    console.log("Running daily BigBasket scrape...");
    try {
      const scrapedProducts = await scrapeBigBasket();

      let supermarket = await Supermarket.findOne({ name: "BigBasket" });

      if (!supermarket) {
        supermarket = new Supermarket({ name: "BigBasket", food_items: scrapedProducts });
      } else {
        supermarket.food_items = scrapedProducts;
      }

      await supermarket.save();
      console.log(`Daily scrape completed: ${scrapedProducts.length} products saved`);
    } catch (error) {
      console.error("Error in daily scrape:", error.message);
    }
  });
}

module.exports = { setupScheduledTasks };
