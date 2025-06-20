import mongoose, { Schema } from "mongoose";

const todoSchema = new Schema(
  {
    title: { type: String, required: true }, // ✅ Fix here
    todo: { type: String, required: true }, // ✅ Fix here
  },
  { timestamps: true }
);

export const Todo = mongoose.model("Todo", todoSchema);
