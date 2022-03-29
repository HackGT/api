import { ObjectId } from "mongodb";
import { Schema, model } from "mongoose";

export interface Team {
  name: string;
  event: ObjectId;
  members: string[];
  description: string;
  public: boolean;
}

const teamSchema = new Schema<Team>({
  name: { type: String, required: true },
  event: { type: ObjectId, required: true },
  members: { type: [String], required: true, default: [] },
  description: { type: String, required: false },
  public: { type: Boolean, required: true, default: false },
});

export const TeamModel = model<Team>("Team", teamSchema);
