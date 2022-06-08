import { Schema, model } from "mongoose";

export interface Hexathon {
  name: string;
  shortCode: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
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
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

export const HexathonModel = model<Hexathon>("Hexathon", hexathonSchema);
