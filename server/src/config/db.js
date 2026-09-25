const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    console.log('[db] No MONGO_URI — running in in-memory demo mode');
    return null;
  }
  // Fail fast (5s) so a bad URI falls back to memory mode instead of hanging boot.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('[db] MongoDB connected');
  return mongoose.connection;
}

module.exports = { connectDB };
