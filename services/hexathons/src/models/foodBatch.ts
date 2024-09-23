import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { HexathonModel } from "./hexathon";

export interface FoodBatch extends mongoose.Document {
  hexathon: Types.ObjectId;
  name: string;
  start: Date;
  end: Date;
}

const foodBatchSchema = new Schema<FoodBatch>({
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
});

foodBatchSchema.plugin(accessibleRecordsPlugin);

export const FoodBatchModel = model<FoodBatch, AccessibleRecordModel<FoodBatch>>(
  "FoodBatch",
  foodBatchSchema
);
