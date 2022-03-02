import { Schema, model, Types } from "mongoose";

export interface Interaction {
    uuid: string,
    userid: string,
    timeIn: string,
}

const interactionSchema = new Schema<Interaction>({
    uuid: {
        type: String,
        required: true,
    },
    userid: {
        type: String,
        required: true,
    },
    timeIn: {
        type: String,
        required: true,
    }
});

export const EventInteraction = model<Interaction>("Interaction", interactionSchema);
