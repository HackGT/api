import { Schema, model, Types, Mixed } from "mongoose";
import autopopulate from "mongoose-autopopulate";

import { BranchModel } from "./branch";

export interface Application {
  userId: string;
  hexathon: Types.ObjectId;
  applicationBranch: Types.ObjectId;
  applicationData: {
    adult?: boolean;
    occupation?: string;
    school?: string;
    graduationYear?: number;
    major?: string;
    shirtSize?: string;
    dietaryRestrictions?: string;
    phoneNumber?: string;
    gender?: string;
    ethnicity?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      zip?: number;
      country?: string;
    };
    website?: string;
    linkedin?: string;
    extraInfo?: [Schema.Types.Mixed];
    confirmChecks?: Schema.Types.Mixed;
    essays?: [Schema.Types.Mixed];
  };
  applicationStartTime: Date;
  applicationSubmitTime?: Date;
  confirmationBranch: Types.ObjectId;
  confirmationData: Mixed;
  confirmationStartTime: Date;
  confirmationSubmitTime?: Date;
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
      adult: {
        type: Boolean,
      },
      occupation: {
        type: String,
      },
      school: {
        type: String,
      },
      graduationYear: {
        type: String,
      },
      major: {
        type: String,
      },
      shirtSize: {
        type: String,
      },
      dietaryRestrictions: {
        type: String,
      },
      phoneNumber: {
        type: String,
      },
      gender: {
        type: String,
      },
      ethnicity: {
        type: String,
      },
      address: {
        line1: {
          type: String,
        },
        line2: {
          type: String,
        },
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        zip: {
          type: Number,
        },
        country: {
          type: String,
        },
      },
      website: {
        type: String,
      },
      linkedin: {
        type: String,
      },
      extraInfo: {
        type: Schema.Types.Array,
      },
      confirmChecks: {
        type: Schema.Types.Mixed,
      },
      essays: {
        type: Schema.Types.Array,
      },
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
