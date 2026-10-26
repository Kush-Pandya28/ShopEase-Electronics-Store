import mongoose from 'mongoose';
import logger from './logger.js';

/** Resolves MONGO_URI; the special value "memory" starts a local dev database. */
export const resolveMongoUri = async (uri = process.env.MONGO_URI) => {
  if (uri !== 'memory') return uri;
  const { startMemoryDb } = await import('./memoryDb.js');
  return startMemoryDb();
};

const connectDB = async (uri = process.env.MONGO_URI) => {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(await resolveMongoUri(uri));
    logger.info(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}`);
    return conn;
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
