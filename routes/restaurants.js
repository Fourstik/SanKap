const express = require('express');
const Restaurant = require('../models/Restaurant');
const { requireAdmin, adminLimiter } = require('../middleware/auth');

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

// GET /api/restaurants/cuisines  -> ["American", "Cafe", ...]
router.get('/cuisines', async (req, res) => {
  res.json(await allCuisines());
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

// ---------- Admin write routes (password required) ----------
const guard = [adminLimiter, requireAdmin];

const BASE_CUISINES = ['American', 'Cafe', 'Chinese', 'Filipino', 'Indian', 'Italian',
  'Japanese', 'Korean', 'Mexican', 'Seafood', 'Vegetarian'];

// "filipino" -> "Filipino"
const properCase = (s) =>
  s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());

// Every cuisine the app knows: the 11 originals plus any custom ones in the database
async function allCuisines() {
  const existing = await Restaurant.distinct('cuisine');
  return [...new Set([...BASE_CUISINES, ...existing])].sort((a, b) => a.localeCompare(b));
}

// Cleans a cuisine name, and match an existing spelling when there is one
async function resolveCuisine(input) {
  const name = String(input || '').trim().replace(/\s+/g, ' ');
  if (!/^\p{L}[\p{L} '&-]{1,29}$/u.test(name)) {
    return { error: 'Cuisine must be 2–30 letters (spaces, - and & are allowed)' };
  }
  if (name.toLowerCase() === 'other') return { error: 'Please enter the specific cuisine' };
  const known = await allCuisines();
  const match = known.find((c) => c.toLowerCase() === name.toLowerCase());
  return { value: match || properCase(name) };
}

const LOCATIONS = ['Angeles City', 'Clark', 'Mabalacat', 'San Fernando'];

// Only these fields are ever read from the request body
function clean(body) {
  const b = body || {};
  return { name: b.name, cuisine: b.cuisine, address: b.address, rating: b.rating, contact: b.contact };
}

// Returns an error message, or null if valid
function validate(d) {
  for (const f of ['name', 'cuisine', 'address', 'contact']) {
    if (typeof d[f] !== 'string' || !d[f].trim()) return `${f} is required`;
  }
  if (!LOCATIONS.includes(d.address)) return 'Invalid location';
  const r = Number(d.rating);
  if (d.rating === '' || d.rating == null || Number.isNaN(r) || r < 0 || r > 5) {
    return 'Rating must be between 0 and 5';
  }
  if (!/^09\d{9}$/.test(d.contact.trim())) return 'Contact must be 11 digits starting with 09';
  d.rating = r;
  return null;
}

// POST /api/restaurants  (restaurant_id is assigned by the server)
router.post('/', ...guard, async (req, res) => {
  const data = clean(req.body);
  const err = validate(data);
  if (err) return res.status(400).json({ message: err });
    const c = await resolveCuisine(data.cuisine);
  if (c.error) return res.status(400).json({ message: c.error });
  data.cuisine = c.value;

  const last = await Restaurant.findOne().sort({ restaurant_id: -1 }).select('restaurant_id');
  data.restaurant_id = last ? last.restaurant_id + 1 : 1;

  const created = await Restaurant.create(data);
  res.status(201).json(created);
});

// PUT /api/restaurants/:id  (restaurant_id itself can't be changed)
router.put('/:id', ...guard, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid restaurant id' });

  const data = clean(req.body);
  const err = validate(data);
  if (err) return res.status(400).json({ message: err });
    const c = await resolveCuisine(data.cuisine);
  if (c.error) return res.status(400).json({ message: c.error });
  data.cuisine = c.value;

  const updated = await Restaurant.findOneAndUpdate({ restaurant_id: id }, data, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ message: 'Restaurant not found' });
  res.json(updated);
});

// DELETE /api/restaurants/:id
router.delete('/:id', ...guard, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid restaurant id' });

  const deleted = await Restaurant.findOneAndDelete({ restaurant_id: id });
  if (!deleted) return res.status(404).json({ message: 'Restaurant not found' });
  res.json({ message: 'Restaurant deleted', restaurant: deleted });
});

module.exports = router;