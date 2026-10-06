// app.js — SanKap server entry point

// Database Connection Fix
if (!process.env.VERCEL) {
  require('node:dns').setServers(['8.8.8.8', '1.1.1.1']);
}

// 1. Load environment variables first so everything below can use process.env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware
app.use(cors());
app.use(express.json()); // lets us read JSON bodies on POST/PUT

// 3. Serve the frontend (HTML, CSS, JS, images) from /public
app.use(express.static(path.join(__dirname, 'public')));

// 4. API routes (uncomment once routes/restaurants.js exists)
app.use('/api/restaurants', require('./routes/restaurants'));
// app.use('/api/admin', require('./routes/admin'));

// 5. Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// 6. Start the server only when run directly (Vercel imports the app instead)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SanKap running at http://localhost:${PORT}`);
  });
}

// 7. Export for Vercel
module.exports = app;