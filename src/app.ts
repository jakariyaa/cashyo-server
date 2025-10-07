import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import errorHandler from "./middlewares/error.middleware";
import router from "./routes";
import { errorResponse, successResponse } from "./utils/responseHandler";

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "https://cashyo.jakariya.eu.org"],
    credentials: true,
  })
);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json(
    successResponse({
      message: "Cashyo Server is running!",
      version: "1.0.0",
    })
  );
});

// API routes
app.use(router);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json(errorResponse("Route not found", 404));
});

// Error handling middleware
app.use(errorHandler);

export default app;
