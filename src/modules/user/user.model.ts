// src/modules/user/user.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import Wallet from '../wallet/wallet.model';
import { UserDocument } from '../../types/user.types';

const userSchema = new Schema<UserDocument>(
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
      trim: true,
      lowercase: true,
    },
    // Password is handled by BetterAuth in 'account' collection for OAuth
    // or implicitly for email/password.
    // However, for compatibility with existing queries, we might want to keep it optional?
    // BetterAuth doesn't store password in the user document usually.
    // Removing it to avoid confusion.
    image: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    sessions: [{
      type: Schema.Types.ObjectId,
      ref: "Session"
    }],
    accounts: [{
      type: Schema.Types.ObjectId,
      ref: "Account"
    }],
    role: {
      type: String,
      enum: ['admin', 'user', 'agent'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    bio: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: 'Global',
    },
    location: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
    },
    agentType: {
      type: String,
      enum: ['Branch', 'ATM', 'Kiosk'],
      default: 'Branch'
    },
    agentStatus: {
      type: String,
      enum: ['Open', 'Closed', 'Closing Soon'],
      default: 'Open'
    },

  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: 'user' // BetterAuth uses singular 'user' collection by default
  }
);

// Hash password before saving
// Hooks removed - handled by BetterAuth

// Create wallet after user is saved
userSchema.post('save', async function (doc: UserDocument) {
  try {
    // Check if wallet already exists for this user
    const existingWallet = await Wallet.findOne({ userId: doc._id });

    if (!existingWallet) {
      // Create wallet with initial balance
      const initialBalance = parseInt(process.env.INITIAL_WALLET_BALANCE || '50');
      await Wallet.create({
        userId: doc._id,
        balance: initialBalance,
        isActive: true,
      });
    }
  } catch (error) {
    console.error('Error creating wallet:', error);
  }
});

// Indexes
// The 'unique: true' option on the email field already creates an index
// This line is intentionally left blank to avoid duplicate indexes

const User = mongoose.model<UserDocument>('User', userSchema);

export default User;