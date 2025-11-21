import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { error as logError, info as logInfo } from '../utils/logger';

dotenv.config();

const MONGO_URL = process.env.MONGODB_URI;
if (!MONGO_URL) {
  throw new Error('MONGODB_URI not set in environment variables');
}

mongoose.connect(`${MONGO_URL}/fake_so`);

const db = mongoose.connection;

db.on('error', (err: unknown) => logError('MongoDB connection error:', err));

/**
 * Clears all collections from the connected MongoDB database.
 *
 * @returns A Promise that resolves when the database has been cleared.
 */
const clearDatabase = async (): Promise<void> => {
  try {
    // Wait for the connection to be established
    await mongoose.connection.once('open', async () => {
      // Clear each collection
      await db.dropDatabase();

      logInfo('Database cleared');
      if (db) db.close();
    });
  } catch (err) {
    logError(`ERROR: ${err}`);
    if (db) db.close();
  }
};

clearDatabase()
  .then(() => {
    logInfo('Processing complete');
  })
  .catch(err => {
    logError(`ERROR: ${err}`);
  });

logInfo('Processing ...');
