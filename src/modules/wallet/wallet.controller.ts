// src/modules/wallet/wallet.controller.ts

import { Request, Response, NextFunction } from 'express';
import Wallet from './wallet.model';
import User from '../user/user.model';
import AppError from '../../utils/AppError';
import { successResponse, errorResponse } from '../../utils/responseHandler';
import { BlockWalletInput } from '../../validation/wallet.validation';

// Get logged in user's wallet
// Get logged in user's wallet
export const getMyWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('You are not logged in!', 401));
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      // Lazy creation of wallet for users migrated or created via BetterAuth
      const initialBalance = parseInt(process.env.INITIAL_WALLET_BALANCE || '50');
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: initialBalance,
        isActive: true,
      });
    }

    res.status(200).json(
      successResponse(
        wallet,
        'Wallet retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Get all wallets (admin only)
export const getAllWallets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallets = await Wallet.find().populate('userId', 'name email role');

    res.status(200).json(
      successResponse(
        wallets,
        'Wallets retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Block/unblock wallet (admin only)
export const blockWallet = async (req: Request<BlockWalletInput['params'], {}, BlockWalletInput['body']>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Find wallet by ID
    const wallet = await Wallet.findById(id);
    if (!wallet) {
      return next(new AppError('Wallet not found', 404));
    }

    // Update wallet status
    wallet.isActive = isActive;
    await wallet.save();

    // Also update user's isActive status if blocking
    if (!isActive) {
      await User.findByIdAndUpdate(wallet.userId, { isActive: false });
    }

    const message = isActive ? 'Wallet unblocked successfully' : 'Wallet blocked successfully';

    res.status(200).json(
      successResponse(
        wallet,
        message
      )
    );
  } catch (error) {
    next(error);
  }
};