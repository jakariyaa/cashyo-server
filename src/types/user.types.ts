// src/types/user.types.ts
import mongoose from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified?: boolean;
  sessions?: mongoose.Types.ObjectId[];
  accounts?: mongoose.Types.ObjectId[];
  role: 'admin' | 'user' | 'agent';
  isActive: boolean;
  isApproved: boolean; // For agents
  bio?: string;
  country?: string;
  location?: string;
  rating?: number;
  agentType?: 'Branch' | 'ATM' | 'Kiosk';
  agentStatus?: 'Open' | 'Closed' | 'Closing Soon';
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface UserDocument extends IUser, IUserMethods, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export interface UserModel extends mongoose.Model<UserDocument> { }