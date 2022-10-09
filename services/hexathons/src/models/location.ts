import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { HexathonModel } from "./hexathon";

export interface Location extends mongoose.Document {
  hexathon: Types.ObjectId;
  name: string;
}

const locationSchema = new Schema<Location>({
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
  },
  name: {
    type: String,
    required: true,
  },
});

locationSchema.plugin(accessibleRecordsPlugin);

export const LocationModel = model<Location, AccessibleRecordModel<Location>>(
  "Location",
  locationSchema
);
