import { BadRequestError } from "@api/common";
import Ajv from "ajv";

import { BranchModel } from "./models/branch";

const ajv = new Ajv();

/**
 * Validates application data based on the branch type.
 * @param branchId Branch ID
 * @param data Application data to validate
 */
export const validateApplicationData = async (
  data: any,
  branchId: any,
  branchFormPage: number,
  checkRequiredFields: boolean
) => {
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

  let { errors } = validate;
  if (!checkRequiredFields) {
    errors = errors?.filter(error => error.keyword !== "required");
  }

  if (valid || errors?.length === 0) {
    return;
  }

  throw new BadRequestError(JSON.stringify(validate.errors, null, 4));
};
