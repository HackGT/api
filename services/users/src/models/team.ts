import { ObjectId } from "mongodb";
import { Schema, model } from "mongoose";

export interface Team {
  name: string;
  event: ObjectId;
  members: string[];
  description: string;
  public: boolean;
  memberRequests: memberReq[];
}

export interface memberReq {
  userId: string;
  message: string;
}

const memberReqSchema = new Schema<memberReq>({
  userId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: false,
  },
});

const teamSchema = new Schema<Team>({
  name: { type: String, required: true },
  event: { type: ObjectId, required: true },
  members: { type: [String], required: true, default: [] },
  description: { type: String, required: false },
  public: { type: Boolean, required: true, default: false },
  memberRequests: { type: [memberReqSchema], default: [] },
});

export const TeamModel = model<Team>("Team", teamSchema);
