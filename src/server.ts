import "dotenv/config";
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/digital_wallet";
let server: Server;

// Server bootstrap
async function bootstrap() {
  try {
    const { connection } = await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB at", connection.host);
    server = app.listen(PORT, () => {
      console.log(`Server is running: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server \n", error);
  }
}

bootstrap();
