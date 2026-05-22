const mongoose = require('mongoose');

const SupermarketSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branches: [
    {
      branch_id: Number,
      branch_name: String,
      location: String,
      hours: {
        open_time: String,
        close_time: String,
      },
      branch_phone: String,
    },
  ],
  food_items: [
    {
      name: String,
      category: String,
      price: Number,
      unit: String,
    },
  ],
});

module.exports = mongoose.model('Supermarket', SupermarketSchema, 'supermarkets');