import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { HexathonModel } from "./hexathon";

export enum InteractionType {
  EVENT = "event",
  SCAVENGER_HUNT = "scavenger-hunt",
  EXPO_SUBMISSION = "expo-submission",
}

export enum InteractionEventType {
  FOOD = "food",
  WORKSHOP = "workshop",
  CEREMONY = "ceremony",
  TECH_TALK = "tech-talk",
  MINI_EVENT = "mini-event",
  IMPORTANT = "important",
  SPEAKER = "speaker",
  MINI_CHALLENGE = "mini-challenge",
}

export interface Interaction extends mongoose.Document {
  userId: string;
  hexathon: Types.ObjectId;
  type: InteractionType;
  identifier?: string;
  eventType?: InteractionEventType;
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
  },
  eventType: {
    type: String,
    enum: Object.values(InteractionEventType),
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
