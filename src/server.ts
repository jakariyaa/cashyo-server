import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/digital_wallet";

// Server bootstrap
function bootstrap() {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error.message);
      console.log("Starting server without database connection...");
      app.listen(PORT, () => {
        console.log(
          `Server running on port ${PORT} (without database connection)`
        );
      });
    });
}
