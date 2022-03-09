import { Schema, model } from "mongoose";

export interface File {
  userId: string;
  mimeType: string;
  fileName: string;
  storageId: string;
}

const fileSchema = new Schema<File>({
  userId: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileName: { type: String, required: true },
  storageId: { type: String, required: true },
});

export const FileModel = model<File>("File", fileSchema);
