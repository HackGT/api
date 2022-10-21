import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { Event, EventModel } from "./event";
import { HexathonModel } from "./hexathon";

export enum InteractionType {
  EVENT = "event",
  SCAVENGER_HUNT = "scavenger-hunt",
  EXPO_SUBMISSION = "expo-submission",
  CHECK_IN = "check-in",
}

export interface Interaction extends mongoose.Document {
  userId: string;
  hexathon: Types.ObjectId;
  type: InteractionType;
  identifier?: string;
  event?: Event;
  timestamp: Date;
}

const interactionSchema = new Schema<Interaction>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(InteractionType),
    required: true,
  },
  identifier: {
    type: String,
    index: true,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: EventModel,
    index: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

interactionSchema.plugin(accessibleRecordsPlugin);

export const InteractionModel = model<Interaction, AccessibleRecordModel<Interaction>>(
  "Interaction",
  interactionSchema
);
