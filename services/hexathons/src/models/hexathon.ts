import { Schema, model } from "mongoose";

export interface Hexathon {
  name: string;
  isActive: boolean;
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
});

export const HexathonModel = model<Hexathon>("Hexathon", hexathonSchema);
