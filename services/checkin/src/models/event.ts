import { Schema, model } from "mongoose";

interface Checkin {}

const checkinSchema = new Schema<Checkin>({});

const CheckinModel = model<Checkin>("Checkin", checkinSchema);
