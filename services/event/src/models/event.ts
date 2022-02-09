import { Schema, model } from "mongoose";

interface Event {}

const eventSchema = new Schema<Event>({
    name: { 
        type: String,
        required: true 
    },
    isActive: { 
        type: Boolean, 
        required: true,
        default: true 
    }
});

const EventModel = model<Event>("Event", eventSchema);