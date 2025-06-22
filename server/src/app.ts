// Configure dotenv FIRST, before any other imports
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// Now import everything else
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "./db/connectDB";
import { redisClient } from "./config/redis";
import cors, { CorsOptions } from "cors";
import TodoRoutes from "./routes/todo";
import UserRoutes from "./routes/user";
import {
  globalErrorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers,
} from "./middlewares/errorHandler";

const app = express();

// ✅ SENIOR APPROACH: Setup global error handlers
setupGlobalErrorHandlers();
const corsOptions: CorsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000", // Specific origin for cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: true, // Enable credentials for cookies
  optionsSuccessStatus: 200, // For legacy browser support
};
app.use(cors(corsOptions));
app.use(express.json()); // ✅ Needed to read req.body
app.use(cookieParser()); // ✅ Needed to read cookies

app.use("/v1/todos", TodoRoutes);
app.use("/v1", UserRoutes);

// ✅ SENIOR APPROACH: Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  // Initialize database
  await connectDB();

  // Initialize Redis
  try {
    await redisClient.connect();
    console.log("🔄 Redis connection initialized");
  } catch (error) {
    console.warn(
      "⚠️  Redis connection failed, continuing without cache:",
      error
    );
  }

  console.log("Server is running at : ", PORT);
});
