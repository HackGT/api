import { Schema, model, Types, Mixed } from "mongoose";
import autopopulate from "mongoose-autopopulate";

import { BranchModel } from "./branch";

export interface Application {
  userId: string;
  hexathon: Types.ObjectId;
  applicationBranch: Types.ObjectId;
  applicationData: {
    adult: boolean;
    occupation: string;
    school: string;
    graduationYear: number;
    major: string;
    shirtSize: string;
    dietaryRestrictions: string;
    phoneNumber: string;
    gender: string;
    ethnicity: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      zip: number;
      country: string;
    };
    website: string;
    linkedin: string;
  };
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
      adult: {
        type: Boolean,
        required: true,
      },
      occupation: {
        type: String,
        required: true,
      },
      school: {
        type: String,
        required: true,
      },
      graduationYear: {
        type: String,
        required: true,
      },
      major: {
        type: String,
        required: true,
      },
      shirtSize: {
        type: String,
        required: true,
      },
      dietaryRestrictions: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      gender: {
        type: String,
        required: true,
      },
      ethnicity: {
        type: String,
        required: true,
      },
      address: {
        line1: {
          type: String,
          required: true,
        },
        line2: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        zip: {
          type: Number,
          required: true,
        },
        country: {
          type: String,
          required: true,
        },
      },
      website: {
        type: String,
        required: false,
      },
      linkedin: {
        type: String,
        required: false,
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
