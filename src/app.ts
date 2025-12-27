import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import errorHandler from "./middlewares/error.middleware";
import router from "./routes";
import { errorResponse, successResponse } from "./utils/responseHandler";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cookieParser());



// Root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json(
    successResponse({
      message: "Cashyo Server is running!",
      version: "1.0.0",
    })
  );
});


import { getAuth } from "./utils/auth";
import cors from "cors";

// Allow CORS for frontend
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

// Better Auth Route
app.all("/api/auth/*path", async (req, res) => {
  const { toNodeHandler } = await (new Function("return import('better-auth/node')")());
  const auth = await getAuth();
  return toNodeHandler(auth)(req, res);
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
