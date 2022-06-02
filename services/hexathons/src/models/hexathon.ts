import { Schema, model } from "mongoose";

export interface Hexathon {
  name: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
}

const hexathonSchema = new Schema<Hexathon>({
  name: {
    type: String,
    required: true,
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
