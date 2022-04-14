import { Schema, model, Types, Mixed } from "mongoose";
import autopopulate from "mongoose-autopopulate";

import { BranchModel } from "./branch";

export interface Application {
  userId: string;
  hexathon: Types.ObjectId;
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
    userId: {
      type: String,
      required: true,
    },
    hexathon: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    applicationBranch: {
      type: Schema.Types.ObjectId,
      ref: BranchModel,
      required: true,
      autopopulate: true,
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
      type: Schema.Types.ObjectId,
      ref: BranchModel,
      autopopulate: true,
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

applicationSchema.plugin(autopopulate);

export const ApplicationModel = model<Application>("Application", applicationSchema);
