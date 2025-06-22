import { model, Schema } from "mongoose";
interface ITodo extends Document {
  title: string;
  todo: string;
  createdBy: string;
}

const todoSchema = new Schema(
  {
    title: { type: String, required: true }, // ✅ Fix here
    todo: { type: String, required: true }, // ✅ Fix here
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Todo = model<ITodo>("Todo", todoSchema);
