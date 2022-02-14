import { Schema, model } from "mongoose";

export interface Profile {
    first: String,
    middle: String,
    last: String,
    phoneNumber: String,
    gender: String,
}

const profileSchema = new Schema<Profile>({
    first: {
        type: String,
        required: true,
    },
    middle: {
        type: String,
    },
    last: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
    },
    gender: {
        type: String,
    },
});

export const ProfileModel = model<Profile>("Profile", profileSchema);
