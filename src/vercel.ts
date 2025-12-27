import mongoose from "mongoose";
import app from "./app";

const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/digital_wallet";

export default async function handler(req: any, res: any) {
    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(MONGODB_URI);
            console.log("Connected to MongoDB (Serverless)");
        } catch (error) {
            console.error("MongoDB connection error:", error);
            // Return error if DB fails, though Vercel might handle uncaught exceptions too
            return res.status(500).json({ error: "Database connection failed" });
        }
    }

    // Pass request to Express app
    return app(req, res);
}
