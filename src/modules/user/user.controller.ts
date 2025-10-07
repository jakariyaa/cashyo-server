// src/modules/user/user.controller.ts

import { NextFunction, Request, Response } from "express";
import AppError from "../../utils/AppError";
import { successResponse } from "../../utils/responseHandler";
import {
  ApproveAgentInput,
  UpdateUserInput,
} from "../../validation/user.validation";
import User from "./user.model";

// Get all users (admin only)
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find().select("-password");

    res
      .status(200)
      .json(successResponse(users, "Users retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

// Update user (self or admin)
export const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, isApproved, isActive } = req.body;

    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Authorization: only user themselves or admin can update
    // @ts-ignore
    if (req.user.role !== "admin" && req.user._id.toString() !== id) {
      return next(
        new AppError("You are not authorized to perform this action", 403)
      );
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    if (role && req.user?.role === "admin") user.role = role; // Only admin can change role
    if (typeof isApproved === "boolean" && req.user?.role === "admin")
      user.isApproved = isApproved; // Only admin can change approval status
    if (typeof isActive === "boolean" && req.user?.role === "admin")
      user.isActive = isActive; // Only admin can change active status
    await user.save();

    res.status(200).json(successResponse(user, "User updated successfully"));
  } catch (error) {
    next(error);
  }
};

// Approve/suspend agent (admin only)
export const approveAgent = async (
  req: Request<ApproveAgentInput["params"], {}, ApproveAgentInput["body"]>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if user is an agent
    if (user.role !== "agent") {
      return next(new AppError("User is not an agent", 400));
    }

    // Update approval status
    user.isApproved = isApproved;
    await user.save();

    const message = isApproved
      ? "Agent approved successfully"
      : "Agent suspended successfully";

    res.status(200).json(successResponse(user, message));
  } catch (error) {
    next(error);
  }
};
