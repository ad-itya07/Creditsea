import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { Role } from '../constants/roles';

const SEED_USERS = [
  { name: 'Admin User',        email: 'admin@lms.com',       password: 'Admin@123',    role: Role.ADMIN },
  { name: 'Sales Executive',   email: 'sales@lms.com',       password: 'Sales@123',    role: Role.SALES },
  { name: 'Sanction Officer',  email: 'sanction@lms.com',    password: 'Sanction@123', role: Role.SANCTION },
  { name: 'Disbursal Officer', email: 'disbursement@lms.com',password: 'Disburse@123', role: Role.DISBURSEMENT },
  { name: 'Collection Agent',  email: 'collection@lms.com',  password: 'Collect@123',  role: Role.COLLECTION },
  { name: 'Sample Borrower',   email: 'borrower@lms.com',    password: 'Borrow@123',   role: Role.BORROWER },
];

const seed = async (): Promise<void> => {
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error('MONGODB_URL not set');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  for (const seedUser of SEED_USERS) {
    const exists = await User.findOne({ email: seedUser.email });

    if (exists) {
      console.log(`Skipped   [${seedUser.role.padEnd(12)}] ${seedUser.email} — already exists`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(seedUser.password, 12);
    await User.create({ ...seedUser, password: hashedPassword });

    console.log(`Created   [${seedUser.role.padEnd(12)}] ${seedUser.email}  /  ${seedUser.password}`);
  }

  console.log('\nSeed complete.');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
