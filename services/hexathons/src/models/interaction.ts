import { Schema, model, Types } from "mongoose";

enum InteractionType {
  EVENT = "event",
  SCAVENGER_HUNT = "scavengerHunt",
}

export interface Interaction {
  userId: string;
  hexathon: Types.ObjectId;
  type: InteractionType;
  identifier?: string;
  timestamp: Date;
}

const interactionSchema = new Schema<Interaction>({
  userId: {
    type: String,
    required: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(InteractionType),
    required: true,
  },
  identifier: {
    type: String,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

export const EventInteraction = model<Interaction>("Interaction", interactionSchema);
