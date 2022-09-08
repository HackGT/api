import { BadRequestError } from "@api/common";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import express from "express";

import { Application, StatusType } from "../models/application";
import { Branch, BranchModel, BranchType } from "../models/branch";

const ajv = new Ajv();
addFormats(ajv);

/**
 * Validates application data based on the branch type.
 * @param branchId Branch ID
 * @param data Application data to validate
 */
export const validateApplicationData = async (data: any, branchId: any, branchFormPage: number) => {
  const branch = await BranchModel.findById(branchId);

  if (branch == null) {
    throw new BadRequestError("Branch not found.");
  }
  if (!Number.isInteger(branchFormPage)) {
    throw new BadRequestError("Invalid branchFormPage field provided. It is not an integer.");
  }
  if (branchFormPage > branch.formPages.length) {
    throw new BadRequestError("Branch form page is out of range.");
  }

  // Use the common definitions for all branches and include in validation
  const parsedSchema = JSON.parse(branch.formPages[branchFormPage].jsonSchema);
  parsedSchema.definitions = JSON.parse(branch.commonDefinitionsSchema);
  const validate = ajv.compile(parsedSchema);
  const valid = validate(data);

  if (valid || validate.errors?.length === 0) {
    return;
  }

  throw new BadRequestError(JSON.stringify(validate.errors, null, 4));
};

/**
 * Gets the correct branch (application or confirmation) based on the request body
 * @param existingApplication the existing application
 * @param req the express request
 */
export const getBranch = (
  existingApplication: Application,
  req: express.Request
): [Branch, BranchType] => {
  switch (req.body.branchType) {
    case BranchType.APPLICATION:
      if (!existingApplication.applicationBranch) {
        throw new BadRequestError(
          "This application does not have an application branch. Please select an application branch first."
        );
      }
      if (
        existingApplication.status !== StatusType.DRAFT &&
        existingApplication.status !== StatusType.APPLIED
      ) {
        throw new BadRequestError(
          "Cannot save application data. Your application already has a decision."
        );
      }

      return [existingApplication.applicationBranch, BranchType.APPLICATION];
    case BranchType.CONFIRMATION:
      if (!existingApplication.confirmationBranch) {
        throw new BadRequestError("This application does not have an confirmation branch.");
      }
      if (existingApplication.status === StatusType.CONFIRMED) {
        throw new BadRequestError(
          "Cannot save confirmation data. You have already submitted your confirmation."
        );
      }
      if (existingApplication.status !== StatusType.ACCEPTED) {
        throw new BadRequestError(
          "Cannot save confirmation data. Your application has not been accepted."
        );
      }

      return [existingApplication.confirmationBranch, BranchType.CONFIRMATION];
    default:
      throw new BadRequestError("Invalid branch type.");
  }
};
