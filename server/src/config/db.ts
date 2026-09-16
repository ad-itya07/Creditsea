import mongoose from 'mongoose';
import { DatabaseError } from '../errors';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URL;

  if (!uri) {
    throw new DatabaseError('MONGODB_URL is not defined in environment variables');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`MongoDB connection failed: ${(error as Error).message}`);
  }
};

export default connectDB;
