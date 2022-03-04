import { Schema, model, Types } from "mongoose";

export interface Interaction {
  uuid: string;
  userId: string;
  timeIn: Date;
  event: Types.ObjectId;
}

const interactionSchema = new Schema<Interaction>({
  uuid: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  timeIn: {
    type: Date,
    required: true,
  },
  event: {
    type: Types.ObjectId,
    required: true,
  },
});

export const EventInteraction = model<Interaction>("Interaction", interactionSchema);
