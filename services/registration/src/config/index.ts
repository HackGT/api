/* eslint-disable no-empty */
/* eslint-disable import/no-mutable-exports */
import config from "@api/config";
import fs from "fs";
import path from "path";

export let calibrationQuestionMapping: any = {};
export let gradingGroupMapping: any = {};
export let rubricMapping: any = {};

if (config.common.production) {
  calibrationQuestionMapping = JSON.parse(
    fs.readFileSync("/tmp/calibration_question_mapping/latest", "utf8")
  );
  gradingGroupMapping = JSON.parse(fs.readFileSync("/tmp/grading_group_mapping/latest", "utf8"));
  rubricMapping = JSON.parse(fs.readFileSync("/tmp/rubric_mapping/latest", "utf8"));
} else {
  try {
    calibrationQuestionMapping = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "./calibration_question_mapping.json"), "utf8")
    );
  } catch {}

  try {
    gradingGroupMapping = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "./grading_group_mapping.json"), "utf8")
    );
  } catch {}

  try {
    rubricMapping = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "./rubric_mapping.json"), "utf8")
    );
  } catch {}
}
