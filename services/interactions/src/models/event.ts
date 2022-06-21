import { Schema, model } from "mongoose";

interface Event {
  eventType: string;
  points: number;
}

const eventSchema = new Schema<Event>({
  eventType: {
    type: String,
    unique: true,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
});

export const EventModel = model<Event>("Event", eventSchema);
