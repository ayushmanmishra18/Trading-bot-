const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    console.log('[db] No MONGO_URI — running in in-memory demo mode');
    return null;
  }
  await mongoose.connect(uri);
  console.log('[db] MongoDB connected');
  return mongoose.connection;
}

module.exports = { connectDB };
