import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, Types, model } from "mongoose";

export interface Review extends mongoose.Document {
  reviewerId: string;
  hexathon: Types.ObjectId;
  applicationId: Types.ObjectId;
  essayId: Types.ObjectId;
  score: number;
  adjustedScore: number;
  timestamp: Date;
}

const reviewSchema = new Schema<Review>({
  reviewerId: {
    type: String,
    required: true,
    index: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  essayId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  score: {
    type: Number,
    required: true,
  },
  adjustedScore: {
    type: Number,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

reviewSchema.plugin(accessibleRecordsPlugin);

export const ReviewModel = model<Review, AccessibleRecordModel<Review>>("Review", reviewSchema);
