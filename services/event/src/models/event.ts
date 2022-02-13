import { Schema, model } from "mongoose";

interface Event {
  name: String;
  isActive: Boolean;
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
