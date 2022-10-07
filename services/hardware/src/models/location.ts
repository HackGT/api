import mongoose, { model, Schema } from "mongoose";

export interface Location extends mongoose.Document {
  name: string;
  hidden: boolean;
}

const LocationSchema = new Schema<Location>({
  name: {
    type: String,
    required: true,
  },
  hidden: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export const LocationModel = model<Location>("Location", LocationSchema);
