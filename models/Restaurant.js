const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    restaurant_id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    cuisine: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    // String so the leading 0 in 09XXXXXXXXX is kept
    contact: { type: String, required: true, trim: true, match: /^09\d{9}$/ },
  },
  { collection: 'restaurants' } // force the collection name
);

module.exports = mongoose.model('Restaurant', restaurantSchema);