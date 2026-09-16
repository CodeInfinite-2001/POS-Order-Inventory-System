const mongoose = require('mongoose');

let mongoServerInstance = null;

/**
 * Connect to MongoDB.
 * If MONGODB_URI is specified in environment, connects to it directly.
 * Otherwise, spins up an embedded in-memory MongoDB replica set so that
 * all ACID transactions and atomic operations work out of the box.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    console.log('[DB] Connecting to MongoDB from MONGODB_URI...');
    await mongoose.connect(uri);
    console.log('[DB] Connected to MongoDB:', mongoose.connection.host);
    return;
  }

  console.log('[DB] No MONGODB_URI provided. Initializing in-memory MongoDB instance...');
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
