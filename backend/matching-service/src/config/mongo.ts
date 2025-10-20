import mongoose from 'mongoose';

export async function connectMongo(): Promise<void> {
  const {
    DB_REQUIRE_AUTH,
    MONGO_INITDB_ROOT_USERNAME,
    MONGO_INITDB_ROOT_PASSWORD,
    DB_HOST = 'localhost',
    DB_PORT = '27017',
    DATABASE_NAME = 'peerprepMatchingServiceDB',
  } = process.env as Record<string, string | undefined>;

  let mongoURI = '';
  if (DB_REQUIRE_AUTH === 'true') {
    mongoURI = `mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@${DB_HOST}:${DB_PORT}/${DATABASE_NAME}?authSource=admin`;
  } else {
    mongoURI = `mongodb://${DB_HOST}:${DB_PORT}/${DATABASE_NAME}`;
  }

  if (!mongoURI) {
    throw new Error('Invalid/Missing MongoDB connection URI');
  }

  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(mongoURI, {});
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.log('Error connecting to MongoDB: ', error);
    throw error;
  }
}

export async function disconnectMongo(): Promise<void> {
  try { await mongoose.disconnect(); } catch {}
}


