import { BadRequestError } from "@api/common";
import Ajv from "ajv";
import fs from "fs";
import path from "path";

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

  const validate = ajv.compile(JSON.parse(branch.formPages[branchFormPage].jsonSchema));
  const valid = validate(data);

  let { errors } = validate;
  if (!checkRequiredFields) {
    errors = errors?.filter(error => error.keyword !== "required");
  }

  if (valid || errors?.length === 0) {
    return;
  }

  throw new BadRequestError(`${validate.errors}`);
};

export function getGroup(email: string) {
  const groupmapping = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "./config/groupmapping.json"), "utf8")
  );
  const criteriamapping = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "./config/criteriamapping.json"), "utf8")
  );
  let criterias = Object.keys(criteriamapping);
  const groups = Object.keys(groupmapping);

  let initialGroup;
  let restGroup;
  /*
    code done below is assuming json object keys not necessarily be ordered.
    But not needed in ES2015 which node should be using. Either change code 
    to use maps or just assume object is ordered!
  */

  // What does this do?
  for (const grp of groups) {
    criterias = criterias.filter((x) => groupmapping[grp].tracks.indexOf(x) < 0);

    if (groupmapping[grp].emails === "rest") {
      restGroup = grp;
    } else if (groupmapping[grp].emails.includes(email)) {
      initialGroup = grp;
    }
  }

  if (!initialGroup) {
    initialGroup = restGroup;
  }

  // if (criterias.length != 0) {
  //   throw new Error('criteriamapping.json formatted incorrectly. The criterias potentially do not match.');
  // }

  if (!initialGroup) {
    throw new Error("Group not set! Ask tech team to look at utils.ts code");
  }

  return initialGroup;
}

export function getInitialGroupsLeft(group: string) {
  const groupmapping = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "./config/groupmapping.json"), "utf8")
  );
  let groups = Object.keys(groupmapping);

  groups = groups.filter((x) => x !== group);

  return groups;
}
