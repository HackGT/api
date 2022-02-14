import { Schema, model } from "mongoose";

export interface Event {
  name: string;
  isActive: boolean;
}

const eventSchema = new Schema<Event>({
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

export const EventModel = model<Event>("Event", eventSchema);
