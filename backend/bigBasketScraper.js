// Static Indian grocery price data — realistic BigBasket-style prices (INR)
// Puppeteer scraping was replaced because BigBasket actively blocks bots.

const GROCERY_DATA = [
  // Fruits
  { name: "Banana (Robusta)",      category: "Fruits",      price: 49,  unit: "1 dozen" },
  { name: "Apple (Shimla)",        category: "Fruits",      price: 129, unit: "500 g" },
  { name: "Mango (Alphonso)",      category: "Fruits",      price: 199, unit: "500 g" },
  { name: "Papaya",                category: "Fruits",      price: 45,  unit: "1 kg" },
  { name: "Pomegranate",           category: "Fruits",      price: 99,  unit: "500 g" },
  { name: "Watermelon",            category: "Fruits",      price: 39,  unit: "1 kg" },
  { name: "Guava",                 category: "Fruits",      price: 55,  unit: "500 g" },
  { name: "Orange (Nagpur)",       category: "Fruits",      price: 79,  unit: "1 kg" },
  { name: "Grapes (Green)",        category: "Fruits",      price: 89,  unit: "500 g" },
  { name: "Pineapple",             category: "Fruits",      price: 65,  unit: "1 pc" },

  // Vegetables
  { name: "Tomato",                category: "Vegetables",  price: 35,  unit: "500 g" },
  { name: "Onion",                 category: "Vegetables",  price: 29,  unit: "1 kg" },
  { name: "Potato",                category: "Vegetables",  price: 29,  unit: "1 kg" },
  { name: "Spinach (Palak)",       category: "Vegetables",  price: 25,  unit: "250 g" },
  { name: "Carrot",                category: "Vegetables",  price: 39,  unit: "500 g" },
  { name: "Capsicum (Green)",      category: "Vegetables",  price: 45,  unit: "250 g" },
  { name: "Cauliflower",           category: "Vegetables",  price: 49,  unit: "1 pc" },
  { name: "Cabbage",               category: "Vegetables",  price: 29,  unit: "1 pc" },
  { name: "Brinjal",               category: "Vegetables",  price: 35,  unit: "500 g" },
  { name: "Lady's Finger (Bhindi)",category: "Vegetables",  price: 45,  unit: "500 g" },
  { name: "Peas (Fresh)",          category: "Vegetables",  price: 55,  unit: "500 g" },
  { name: "Bottle Gourd (Lauki)",  category: "Vegetables",  price: 29,  unit: "1 pc" },
  { name: "Bitter Gourd (Karela)", category: "Vegetables",  price: 45,  unit: "500 g" },
  { name: "Garlic",                category: "Vegetables",  price: 59,  unit: "250 g" },
  { name: "Ginger",                category: "Vegetables",  price: 35,  unit: "100 g" },

  // Grains & Pulses
  { name: "Basmati Rice",          category: "Grains",      price: 149, unit: "1 kg" },
  { name: "Whole Wheat Atta",      category: "Grains",      price: 69,  unit: "1 kg" },
  { name: "Toor Dal",              category: "Grains",      price: 139, unit: "500 g" },
  { name: "Moong Dal",             category: "Grains",      price: 129, unit: "500 g" },
  { name: "Chana Dal",             category: "Grains",      price: 109, unit: "500 g" },
  { name: "Rajma (Kidney Beans)",  category: "Grains",      price: 99,  unit: "500 g" },
  { name: "Oats",                  category: "Grains",      price: 119, unit: "500 g" },
  { name: "Poha (Flattened Rice)", category: "Grains",      price: 59,  unit: "500 g" },
  { name: "Suji (Semolina)",       category: "Grains",      price: 49,  unit: "500 g" },

  // Dairy
  { name: "Full Cream Milk",       category: "Dairy",       price: 30,  unit: "500 ml" },
  { name: "Curd (Dahi)",           category: "Dairy",       price: 49,  unit: "400 g" },
  { name: "Paneer",                category: "Dairy",       price: 99,  unit: "200 g" },
  { name: "Butter (Amul)",         category: "Dairy",       price: 55,  unit: "100 g" },
  { name: "Ghee",                  category: "Dairy",       price: 199, unit: "200 ml" },
  { name: "Cheese Slices",         category: "Dairy",       price: 99,  unit: "200 g" },
  { name: "Whey Protein (Plain)",  category: "Dairy",       price: 849, unit: "500 g" },

  // Protein / Meat
  { name: "Eggs (Farm Fresh)",     category: "Protein",     price: 89,  unit: "12 pcs" },
  { name: "Chicken Breast",        category: "Protein",     price: 199, unit: "500 g" },
  { name: "Rohu Fish",             category: "Protein",     price: 179, unit: "500 g" },
  { name: "Mutton (Boneless)",     category: "Protein",     price: 499, unit: "500 g" },

  // Oils & Condiments
  { name: "Sunflower Oil",         category: "Oils",        price: 139, unit: "1 litre" },
  { name: "Mustard Oil",           category: "Oils",        price: 149, unit: "1 litre" },
  { name: "Olive Oil (Extra Virgin)",category:"Oils",        price: 499, unit: "500 ml" },
  { name: "Coconut Oil",           category: "Oils",        price: 179, unit: "500 ml" },
  { name: "Turmeric Powder",       category: "Spices",      price: 49,  unit: "100 g" },
  { name: "Red Chilli Powder",     category: "Spices",      price: 55,  unit: "100 g" },
  { name: "Coriander Powder",      category: "Spices",      price: 45,  unit: "100 g" },
  { name: "Cumin (Jeera)",         category: "Spices",      price: 69,  unit: "100 g" },
  { name: "Garam Masala",          category: "Spices",      price: 65,  unit: "100 g" },

  // Beverages
  { name: "Green Tea (Tulsi)",     category: "Beverages",   price: 149, unit: "25 bags" },
  { name: "Black Coffee (Powder)", category: "Beverages",   price: 199, unit: "100 g" },
  { name: "Coconut Water",         category: "Beverages",   price: 45,  unit: "200 ml" },
];

async function scrapeBigBasket() {
  // Return static data instantly — no network calls, no Puppeteer.
  // BigBasket actively blocks scrapers; this gives reliable, realistic data.
  return GROCERY_DATA;
}

module.exports = { scrapeBigBasket };
