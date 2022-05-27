import { BadRequestError } from "@api/common";
import Ajv from "ajv";

import { BranchModel } from "./models/branch";

const ajv = new Ajv();

/**
 * Validates application data based on the branch type.
 * @param branchId Branch ID
 * @param data Application data to validate
 */
export const validateApplicationData = async (branchId: any, data: any) => {
  const branch = await BranchModel.findById(branchId);
  if (branch == null) {
    throw new BadRequestError("Branch not found.");
  }

  const validate = ajv.compile(branch.jsonSchema);
  const valid = validate(data);

  if (!valid) {
    throw new BadRequestError(`${validate.errors}`);
  }
};
