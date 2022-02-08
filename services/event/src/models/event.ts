import { Schema, model } from "mongoose";

interface Event {}

const eventSchema = new Schema<Event>({});

const EventModel = model<Event>("Event", eventSchema);
