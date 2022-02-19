import { Schema, model } from "mongoose";

export interface Interaction {}

const interactionSchema = new Schema<Interaction>({});

export const InteractionModel = model<Interaction>("Interaction", interactionSchema);
