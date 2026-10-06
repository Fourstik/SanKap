if (!process.env.VERCEL) {
  require('node:dns').setServers(['8.8.8.8', '1.1.1.1']);
}
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Restaurant.init(); // make sure the unique index exists

  const file = path.join(__dirname, 'data', 'restaurants.json');
  const records = JSON.parse(fs.readFileSync(file, 'utf8'));

  await Restaurant.deleteMany({});
  await Restaurant.insertMany(records);

  console.log(`Seeded ${records.length} restaurants`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});