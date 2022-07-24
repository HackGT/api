import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, Types, model } from "mongoose";

export interface Review extends mongoose.Document {
  reviewerId: string;
  essayId: Types.ObjectId;
  score: number;
  adjustedScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<Review>(
  {
    reviewerId: {
      type: String,
      required: true,
    },
    essayId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    adjustedScore: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.plugin(accessibleRecordsPlugin);

export const ReviewModel = model<Review, AccessibleRecordModel<Review>>("Review", reviewSchema);
