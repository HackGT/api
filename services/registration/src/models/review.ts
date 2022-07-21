import { Schema, Types, model } from "mongoose";

export interface Review {
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

export const ReviewModel = model<Review>("Review", reviewSchema);
