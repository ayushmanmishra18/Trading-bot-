// Seed demo user + sample bot. Run: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');

async function main() {
  await connectDB(process.env.MONGO_URI);
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    console.log('No DB — seed skipped (in-memory mode needs no seed). Demo login: demo@college.edu / demo1234');
    process.exit(0);
  }
  const User = require('./models/User');
  const Bot = require('./models/Bot');
  const email = 'demo@college.edu';
  let u = await User.findOne({ email });
  if (!u) {
    u = await User.create({ name: 'Demo Student', email, passwordHash: await bcrypt.hash('demo1234', 10), cash: 100000 });
    console.log('Demo user created:', email, '/ demo1234');
  }
  const count = await Bot.countDocuments({ userId: u._id });
  if (!count) {
    await Bot.create({ userId: u._id, name: 'BTC SMA Bot', symbol: 'BTCUSDT', strategy: 'SMA_CROSS', timeframe: '1h', capital: 5000, status: 'stopped' });
    console.log('Sample bot created');
  }
  process.exit(0);
}
main();
