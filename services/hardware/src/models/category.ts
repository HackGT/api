import mongoose, { model, Schema } from "mongoose";

export interface Category extends mongoose.Document {
  name: string;
}

const CategorySchema = new Schema<Category>({
  name: {
    type: String,
    required: true,
  },
});

export const CategoryModel = model<Category>("Category", CategorySchema);
