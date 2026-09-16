import mongoose, { Document, Schema } from 'mongoose';
import { Role } from '../constants/roles';

export interface IUserProfile {
  fullName?: string;
  pan?: string;
  dateOfBirth?: Date;
  monthlySalary?: number;
  employmentMode?: 'Salaried' | 'Self-Employed' | 'Unemployed';
  salarySlipUrl?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  profile: IUserProfile;
  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new Schema<IUserProfile>(
  {
    fullName: { type: String },
    pan: { type: String, uppercase: true },
    dateOfBirth: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: ['Salaried', 'Self-Employed', 'Unemployed'],
    },
    salarySlipUrl: { type: String },
  },
  { _id: false } 
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, 
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
      default: Role.BORROWER,
    },
    profile: {
      type: userProfileSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>('User', userSchema);
export default User;
