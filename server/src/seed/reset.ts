import mongoose from 'mongoose';
import 'dotenv/config';

const reset = async () => {
  await mongoose.connect(process.env.MONGODB_URL as string);
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped');
  }
  await mongoose.disconnect();
};

reset();
