import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model } from "mongoose";

export interface Location extends mongoose.Document {
  name: string;
}

const locationSchema = new Schema<Location>({
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
