import { Schema, model, Types, Mixed } from "mongoose";

export interface Application {
  user: string;
  event: Types.ObjectId;
  applicationBranch: Types.ObjectId;
  applicationData: Mixed;
  applicationStartTime: Date;
  applicationSubmitTime: Date;
  confirmationBranch: Types.ObjectId;
  confirmationData: Mixed;
  confirmationStartTime: Date;
  confirmationSubmitTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<Application>(
  {
    user: {
      type: String,
      required: true,
    },
    event: {
      type: Types.ObjectId,
      required: true,
    },
    applicationBranch: {
      type: Types.ObjectId,
      required: true,
    },
    applicationData: {
      type: Schema.Types.Mixed,
    },
    applicationStartTime: {
      type: Date,
      required: true,
    },
    applicationSubmitTime: {
      type: Date,
    },
    confirmationBranch: {
      type: Types.ObjectId,
    },
    confirmationData: {
      type: Schema.Types.Mixed,
    },
    confirmationStartTime: {
      type: Date,
    },
    confirmationSubmitTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const ApplicationModel = model<Application>("Application", applicationSchema);
