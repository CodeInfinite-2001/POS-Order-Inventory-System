const mongoose = require('mongoose');

let mongoServerInstance = null;

/**
 * Connect to MongoDB.
 * If MONGODB_URI is specified in environment, connects to it directly.
 * Otherwise, spins up an embedded in-memory MongoDB replica set so that
 * all ACID transactions and atomic operations work out of the box.
 */
async function connectDB() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.MONGO_PRIVATE_URL ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL;

  if (uri) {
    const sourceVar = process.env.MONGODB_URI
      ? 'MONGODB_URI'
      : process.env.MONGO_URL
      ? 'MONGO_URL'
      : process.env.MONGO_PRIVATE_URL
      ? 'MONGO_PRIVATE_URL'
      : process.env.MONGODB_URL
      ? 'MONGODB_URL'
      : 'DATABASE_URL';

    // Mask credentials in log
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    console.log(`[DB] Connecting to MongoDB using ${sourceVar} (${maskedUri})...`);

    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
      });
      console.log('[DB] Connected successfully to MongoDB host:', mongoose.connection.host);
      return;
    } catch (err) {
      console.error('[DB] Failed to connect to remote MongoDB:', err.message);
      throw err;
    }
  }

  console.log('[DB] No MONGODB_URI or MONGO_URL provided. Initializing in-memory MongoDB instance...');
  try {
    const { MongoMemoryReplSet, MongoMemoryServer } = require('mongodb-memory-server');
    
    // Attempt replica set first for multi-document transaction support
    try {
      mongoServerInstance = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: 'wiredTiger' },
      });
      const replUri = mongoServerInstance.getUri();
      console.log('[DB] In-memory Replica Set started at:', replUri);
      await mongoose.connect(replUri);
      console.log('[DB] Connected to in-memory MongoDB replica set.');
      return;
    } catch (replErr) {
      console.warn('[DB] Could not start replica set, falling back to standalone in-memory server:', replErr.message);
      mongoServerInstance = await MongoMemoryServer.create();
      const standaloneUri = mongoServerInstance.getUri();
      await mongoose.connect(standaloneUri);
      console.log('[DB] Connected to standalone in-memory MongoDB.');
    }
  } catch (err) {
    console.error('[DB] Failed to initialize in-memory MongoDB:', err);
    throw err;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoServerInstance) {
    await mongoServerInstance.stop();
    mongoServerInstance = null;
  }
  console.log('[DB] Disconnected from MongoDB.');
}

module.exports = {
  connectDB,
  disconnectDB,
};
