import { Schema, model } from "mongoose";

enum InteractionType {
  HEXATHON = "hexathon",
  SCAVENGER_HUNT = "scavengerHunt",
}

export interface Interaction {
  userId: string;
  type: InteractionType;
  identifier?: string;
  timestamp: Date;
  hackathon: string;
}

const interactionSchema = new Schema<Interaction>({
  userId: {
    type: String,
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
  hackathon: {
    type: String,
    required: true,
  },
});

export const HexathonInteraction = model<Interaction>("Interaction", interactionSchema);
