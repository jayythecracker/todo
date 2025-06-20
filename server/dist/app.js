"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const connectDB_1 = require("./db/connectDB");
const cors_1 = __importDefault(require("cors"));
const todo_1 = __importDefault(require("./routes/todo"));
const app = (0, express_1.default)();
dotenv_1.default.config({
    path: ".env",
});
const corsOptions = {
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
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json()); // ✅ Needed to read req.body
app.use(todo_1.default);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    (0, connectDB_1.connectDB)();
    console.log("Server is running at : ", PORT);
});
