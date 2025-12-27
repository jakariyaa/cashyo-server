// src/modules/transaction/transaction.controller.ts

import { Request, Response, NextFunction } from "express";
import mongoose, { ClientSession } from "mongoose";
import Wallet from "../wallet/wallet.model";
import Transaction from "./transaction.model";
import User from "../user/user.model";
import AppError from "../../utils/AppError";
import { successResponse, errorResponse } from "../../utils/responseHandler";
import { calculateTransactionFee } from "../../utils/transactionFees";
import { UserDocument } from "../../types/user.types";
import {
  AddMoneyInput,
  WithdrawMoneyInput,
  SendMoneyInput,
  CashInInput,
  CashOutInput
} from "../../validation/transaction.validation";

// Helper function to check if wallet is active
const checkWalletActive = async (walletId: mongoose.Types.ObjectId) => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }
  if (!wallet.isActive) {
    throw new AppError("Wallet is blocked", 400);
  }
  return wallet;
};

// Add money to own wallet (User)
export const addMoney = async (
  req: Request<{}, {}, AddMoneyInput>,
  res: Response,
  next: NextFunction
) => {
  const session: ClientSession = await mongoose.startSession();

  try {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    const { amount } = req.body;

    await session.withTransaction(async () => {
      // Get user's wallet
      let wallet = await Wallet.findOne({ userId: req.user!._id }).session(
        session
      );

      if (!wallet) {
        // Lazy creation
        const initialBalance = parseInt(process.env.INITIAL_WALLET_BALANCE || '50');
        wallet = await Wallet.create([{
          userId: req.user!._id,
          balance: initialBalance,
          isActive: true,
        }], { session }).then(wallets => wallets[0]);
      }

      if (!wallet) {
        throw new AppError("Failed to find or create wallet", 500);
      }

      // Check if wallet is active
      if (!wallet.isActive) {
        throw new AppError("Wallet is blocked", 400);
      }

      // Update wallet balance
      wallet.balance += amount;
      await wallet.save({ session });

      // Create transaction record
      const transaction = await Transaction.create(
        [
          {
            type: "add",
            amount,
            fromWalletId: wallet._id,
            initiatedBy: req.user!._id,
            status: "completed",
          },
        ],
        { session }
      );

      res.status(200).json(
        successResponse(
          {
            transaction: transaction[0],
            newBalance: wallet.balance,
          },
          "Money added successfully"
        )
      );
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

// Withdraw money from own wallet (User)
export const withdrawMoney = async (
  req: Request<{}, {}, WithdrawMoneyInput>,
  res: Response,
  next: NextFunction
) => {
  const session: ClientSession = await mongoose.startSession();

  try {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    const { amount } = req.body;

    await session.withTransaction(async () => {
      // Get user's wallet
      const wallet = await Wallet.findOne({ userId: req.user!._id }).session(
        session
      );

      if (!wallet) {
        throw new AppError("Wallet not found", 404);
      }

      // Check if wallet is active
      if (!wallet.isActive) {
        throw new AppError("Wallet is blocked", 400);
      }

      // Check sufficient balance
      if (wallet.balance < amount) {
        throw new AppError("Insufficient balance", 400);
      }

      // Update wallet balance
      wallet.balance -= amount;
      await wallet.save({ session });

      // Create transaction record
      const transaction = await Transaction.create(
        [
          {
            type: "withdraw",
            amount,
            fromWalletId: wallet._id,
            initiatedBy: req.user!._id,
            status: "completed",
          },
        ],
        { session }
      );

      res.status(200).json(
        successResponse(
          {
            transaction: transaction[0],
            newBalance: wallet.balance,
          },
          "Money withdrawn successfully"
        )
      );
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

// Send money to another user (User)
export const sendMoney = async (
  req: Request<{}, {}, SendMoneyInput>,
  res: Response,
  next: NextFunction
) => {
  const session: ClientSession = await mongoose.startSession();

  try {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    const { receiverEmail, amount } = req.body;

    await session.withTransaction(async () => {
      // Get sender's wallet
      const senderWallet = await Wallet.findOne({
        userId: req.user!._id,
      }).session(session);

      if (!senderWallet) {
        throw new AppError("Wallet not found", 404);
      }

      // Check if sender's wallet is active
      if (!senderWallet.isActive) {
        throw new AppError("Your wallet is blocked", 400);
      }

      // Calculate fee
      const { fee, feeType, feeValue } = calculateTransactionFee(
        "send",
        amount
      );

      // Check sufficient balance (amount + fee)
      if (senderWallet.balance < amount + fee) {
        throw new AppError("Insufficient balance", 400);
      }

      // Get receiver user
      const receiverUser = await User.findOne({ email: receiverEmail }).session(
        session
      );

      if (!receiverUser) {
        throw new AppError("Receiver not found", 404);
      }

      // Get receiver's wallet
      const receiverWallet = await Wallet.findOne({
        userId: receiverUser._id,
      }).session(session);

      if (!receiverWallet) {
        throw new AppError("Receiver wallet not found", 404);
      }

      // Check if receiver's wallet is active
      if (!receiverWallet.isActive) {
        throw new AppError("Receiver wallet is blocked", 400);
      }

      // Update wallets balance
      senderWallet.balance -= amount + fee;
      receiverWallet.balance += amount;

      await senderWallet.save({ session });
      await receiverWallet.save({ session });

      // Create transaction record
      const transaction = await Transaction.create(
        [
          {
            type: "send",
            amount,
            fee,
            feeType,
            feeValue,
            fromWalletId: senderWallet._id,
            toWalletId: receiverWallet._id,
            initiatedBy: req.user!._id,
            status: "completed",
          },
        ],
        { session }
      );

      res.status(200).json(
        successResponse(
          {
            transaction: transaction[0],
            newBalance: senderWallet.balance,
          },
          "Money sent successfully"
        )
      );
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

// Cash-in to user's wallet (Agent)
export const cashIn = async (
  req: Request<{}, {}, CashInInput>,
  res: Response,
  next: NextFunction
) => {
  const session: ClientSession = await mongoose.startSession();

  try {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    // Check if user is agent
    if (req.user.role !== "agent") {
      return next(new AppError("Only agents can perform this action", 403));
    }

    // Check if agent is approved
    if (!req.user.isApproved) {
      return next(new AppError("Agent not approved", 403));
    }

    const { userEmail, amount } = req.body;

    await session.withTransaction(async () => {
      // Check if agent's wallet is active
      const agentWallet = await Wallet.findOne({
        userId: req.user!._id,
      }).session(session);

      if (!agentWallet) {
        throw new AppError("Agent wallet not found", 404);
      }

      if (!agentWallet.isActive) {
        throw new AppError("Agent wallet is blocked", 400);
      }

      // Get user
      const user = await User.findOne({ email: userEmail }).session(session);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Get user's wallet
      const userWallet = await Wallet.findOne({ userId: user._id }).session(
        session
      );

      if (!userWallet) {
        throw new AppError("User wallet not found", 404);
      }

      // Check if user's wallet is active
      if (!userWallet.isActive) {
        throw new AppError("User wallet is blocked", 400);
      }

      // Update user's wallet balance
      userWallet.balance += amount;
      await userWallet.save({ session });

      // Create transaction record
      const transaction = await Transaction.create(
        [
          {
            type: "cash-in",
            amount,
            toWalletId: userWallet._id,
            initiatedBy: req.user!._id,
            status: "completed",
          },
        ],
        { session }
      );

      res.status(200).json(
        successResponse(
          {
            transaction: transaction[0],
            newUserBalance: userWallet.balance,
          },
          "Cash-in successful"
        )
      );
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

// Cash-out from user's wallet (Agent)
export const cashOut = async (
  req: Request<{}, {}, CashOutInput>,
  res: Response,
  next: NextFunction
) => {
  const session: ClientSession = await mongoose.startSession();

  try {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    // Check if user is agent
    if (req.user.role !== "agent") {
      return next(new AppError("Only agents can perform this action", 403));
    }

    // Check if agent is approved
    if (!req.user.isApproved) {
      return next(new AppError("Agent not approved", 403));
    }

    const { userEmail, amount } = req.body;

    await session.withTransaction(async () => {
      // Check if agent's wallet is active
      const agentWallet = await Wallet.findOne({
        userId: req.user!._id,
      }).session(session);

      if (!agentWallet) {
        throw new AppError("Agent wallet not found", 404);
      }

      if (!agentWallet.isActive) {
        throw new AppError("Agent wallet is blocked", 400);
      }

      // Get user
      const user = await User.findOne({ email: userEmail }).session(session);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Get user's wallet
      const userWallet = await Wallet.findOne({ userId: user._id }).session(
        session
      );

      if (!userWallet) {
        throw new AppError("User wallet not found", 404);
      }

      // Check if user's wallet is active
      if (!userWallet.isActive) {
        throw new AppError("User wallet is blocked", 400);
      }

      // Calculate fee
      const { fee, feeType, feeValue } = calculateTransactionFee(
        "cash-out",
        amount
      );

      // Check sufficient balance (amount + fee)
      if (userWallet.balance < amount + fee) {
        throw new AppError("User has insufficient balance", 400);
      }

      // Update user's wallet balance
      userWallet.balance -= amount + fee;
      await userWallet.save({ session });

      // Credit agent's wallet with commission (fee)
      agentWallet.balance += fee;
      await agentWallet.save({ session });

      // Create transaction record
      const transaction = await Transaction.create(
        [
          {
            type: "cash-out",
            amount,
            fee,
            feeType,
            feeValue,
            fromWalletId: userWallet._id,
            toWalletId: agentWallet._id, // Agent's wallet receives the fee as commission
            initiatedBy: req.user!._id,
            status: "completed",
          },
        ],
        { session }
      );

      res.status(200).json(
        successResponse(
          {
            transaction: transaction[0],
            newUserBalance: userWallet.balance,
          },
          "Cash-out successful"
        )
      );
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

// Get own transactions (User/Agent)
export const getMyTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    // Get user wallet safely
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      // Lazy create if needed, though usually getMyWallet is called first. 
      // For now, if no wallet, returning empty transactions is safe.
      // Or consistent behavior: create it.
      const initialBalance = parseInt(process.env.INITIAL_WALLET_BALANCE || '50');
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: initialBalance,
        isActive: true,
      });
    }

    if (!wallet) {
      throw new AppError("Failed to find or create wallet", 500);
    }

    const transactions = await Transaction.find({
      $or: [
        { initiatedBy: req.user._id },
        {
          fromWalletId: wallet._id,
        },
        {
          toWalletId: wallet._id,
        },
      ],
    } as any)
      .populate("fromWalletId", "userId balance")
      .populate("toWalletId", "userId balance")
      .populate("initiatedBy", "name email")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json(
        successResponse(transactions, "Transactions retrieved successfully")
      );
  } catch (error) {
    next(error);
  }
};

// Get all transactions (Admin)
export const getAllTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const transactions = await Transaction.find()
      .populate("fromWalletId", "userId balance")
      .populate("toWalletId", "userId balance")
      .populate("initiatedBy", "name email")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json(
        successResponse(transactions, "All transactions retrieved successfully")
      );
  } catch (error) {
    next(error);
  }
};
