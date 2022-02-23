import { Schema, model } from "mongoose";

export interface File {}

const fileSchema = new Schema<File>({});

export const FileModel = model<File>("File", fileSchema);
