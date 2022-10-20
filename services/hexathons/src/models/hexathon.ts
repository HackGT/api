import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model } from "mongoose";

export interface Hexathon extends mongoose.Document {
  name: string;
  shortCode: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  emailHeaderImage?: string;
  coverImage?: string;
}

const hexathonSchema = new Schema<Hexathon>({
  name: {
    type: String,
    required: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
    index: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  emailHeaderImage: {
    type: String,
  },
  coverImage: {
    type: String,
  },
});

hexathonSchema.plugin(accessibleRecordsPlugin);

export const HexathonModel = model<Hexathon, AccessibleRecordModel<Hexathon>>(
  "Hexathon",
  hexathonSchema
);
