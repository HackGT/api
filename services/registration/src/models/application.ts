import { Schema, Types, Mixed, PaginateModel, model } from "mongoose";
import mongooseAutopopulate from "mongoose-autopopulate";
import mongoosePaginate from "mongoose-paginate-v2";

import { Branch, BranchModel } from "./branch";

export interface Application {
  userId: string;
  hexathon: Types.ObjectId;
  applicationBranch: Branch;
  applicationData: Mixed;
  applicationStartTime: Date;
  applicationSubmitTime: Date;
  confirmationBranch: Branch;
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

applicationSchema.plugin(mongooseAutopopulate);
applicationSchema.plugin(mongoosePaginate);

export const ApplicationModel = model<Application, PaginateModel<Application>>(
  "Application",
  applicationSchema
);
