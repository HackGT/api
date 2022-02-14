import { Schema, model } from "mongoose";

interface Profile {}

const profileSchema = new Schema<Profile>({});

const ProfileModel = model<Profile>("Profile", profileSchema);
