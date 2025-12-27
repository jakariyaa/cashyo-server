// src/middlewares/auth.middleware.ts

import { NextFunction, Request, Response } from "express";
import User from "../modules/user/user.model";
import { UserDocument } from "../types/user.types";
import AppError from "../utils/AppError";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

interface JwtPayload {
  id: string;
  role: string;
}

import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../utils/auth";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    // 1) Verify session using BetterAuth
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // 2) Check if user still exists
    // We fetch from Mongoose to ensure we have all fields/methods and consistent typing
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401
        )
      );
    }

    // 3) Check if user is active
    if (!currentUser.isActive) {
      return next(new AppError("This user account has been deactivated.", 401));
    }

    // 4) For agents, check if approved
    if (currentUser.role === "agent" && !currentUser.isApproved) {
      return next(new AppError("Agent account is not approved yet", 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error: any) {
    next(new AppError("Authentication failed", 401));
  }
};

// Restrict access to certain roles
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};
