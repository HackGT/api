import { BadRequestError, ConfigError } from "@api/common";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import express from "express";

import { Application, StatusType } from "../models/application";
import { Branch, BranchModel, BranchType } from "../models/branch";

const ajv = new Ajv({ removeAdditional: "all" });
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

  if (branchFormPage > branch.formPages.length) {
    throw new BadRequestError("Branch form page is out of range.");
  }

  if (!Number.isInteger(branchFormPage)) {
    throw new BadRequestError("Invalid branchFormPage field provided. It is not an integer.");
  }

  // Use the common definitions for all branches and include in validation
  const parsedSchema = JSON.parse(branch.formPages[branchFormPage].jsonSchema);
  parsedSchema.definitions = JSON.parse(branch.commonDefinitionsSchema);
  const validate = ajv.compile(parsedSchema);
  const valid = validate(data);

  console.log(validate.evaluated);

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

/**
 * Get initial grading group for a user by reading the config .json file. If a user email is specifically assigned to a
 * grading group, then that group is returned. Otherwise, the default grading group is returned. This is the grading group
 * specified with "emails": "rest".
 * @param email the user's email address
 * @param gradingGroupMapping the grading group mapping read from the config file
 * @returns the specified user's grading group
 */
export function getUserInitialGradingGroup(email: string, gradingGroupMapping: any) {
  let initialGradingGroup: string | undefined;
  let restGradingGroup: string | undefined;

  for (const gradingGroup of Object.keys(gradingGroupMapping)) {
    if (gradingGroupMapping[gradingGroup].emails === "rest") {
      restGradingGroup = gradingGroup;
    } else if (
      Array.isArray(gradingGroupMapping[gradingGroup].emails) &&
      gradingGroupMapping[gradingGroup].emails.includes(email)
    ) {
      initialGradingGroup = gradingGroup;
    }
  }
  // If no specific grading group is found, set the default rest grading group
  initialGradingGroup = initialGradingGroup ?? restGradingGroup;

  if (!initialGradingGroup) {
    throw new ConfigError(
      "User grading group not set. Please ask a tech team member to update the config mapping."
    );
  }

  return initialGradingGroup;
}
