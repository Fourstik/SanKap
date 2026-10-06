const express = require('express');
const Restaurant = require('../models/Restaurant');

const router = express.Router();

// Escape user input so it can't act as a regex pattern
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/restaurants
// Optional query: search, cuisine (comma-separated), location, minRating, sort, limit
router.get('/', async (req, res) => {
  const { search, cuisine, location, minRating, sort, limit } = req.query;
  const filter = {};

  // Search matches name OR location (address) at the same time
  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: rx }, { address: rx }];
  }

  // Multiple cuisines allowed: ?cuisine=Filipino,Italian
  if (cuisine) {
    const list = String(cuisine).split(',').map((c) => c.trim()).filter(Boolean);
    if (list.length) filter.cuisine = { $in: list };
  }

  if (location && location !== 'all') {
    filter.address = String(location);
  }

  const min = parseFloat(minRating);
  if (!Number.isNaN(min)) filter.rating = { $gte: min };

  // Whitelisted sorts, always with a tiebreaker so order is stable
  const sorts = {
    rating_desc: { rating: -1, name: 1 },
    rating_asc: { rating: 1, name: 1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
  };
  const sortBy = sorts[sort] || sorts.rating_desc;

  let query = Restaurant.find(filter).sort(sortBy);
  const lim = parseInt(limit, 10);
  if (lim > 0) query = query.limit(Math.min(lim, 100));

  const restaurants = await query;
  res.json(restaurants);
});

// GET /api/restaurants/:id  (uses restaurant_id, not Mongo's _id)
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid restaurant id' });
  }
  const restaurant = await Restaurant.findOne({ restaurant_id: id });
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  res.json(restaurant);
});

module.exports = router;