import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/connectDB";
import cors, { CorsOptions } from "cors";
import TodoRoutes from "./routes/todo";
const app = express();

dotenv.config({
  path: ".env",
});
const corsOptions: CorsOptions = {
  origin: true, // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: false, // Set to false for development
  // optionsSuccessStatus: 200, // For legacy browser support
};
app.use(cors(corsOptions));
app.use(express.json()); // ✅ Needed to read req.body

app.use(TodoRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  connectDB();
  console.log("Server is running at : ", PORT);
});
