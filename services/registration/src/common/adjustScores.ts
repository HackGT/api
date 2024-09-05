import _ from "lodash";

import { calibrationQuestionMapping, rubricMapping } from "../config";
import { GradingGroupType } from "../models/branch";

/**
 * BIAS ADJUSTMENT:
 *
 *                          Grading Group A                              Grading Group B [...]
 *                        _________|__________                         _________|_________________
 *                       |         |          \                       |         |                 \
 *                 Criteria A   Criteria B  Criteria C             Criteria A   Criteria B    Criteria C [...]
 *                  /  \          /  \         /  \                /  \          /  \             /  \
 *                CQ1  CQ2       CQ3  CQ4     CQ5  CQ6            CQ7  CQ8       CQ9  CQ10     CQ11  CQ12 [...]
 *
 * CQ = Calibration Question
 *
 * Each grader will have to first complete all calibration questions for the grading group. Then, they will be assigned
 * a score mapping (score -> adjusted score) based on their calibration scores (computed using a line of best fit vs ground truth
 * scores), per criteria. Upon reviewing an actual essay thereafter, the Review will store an
 * adjustedScore value. This way, we can account for grader bias per criteria.
 */

type CriteriaScores = {
  criteria: string;
  score: number;
}[];

/** The minimum grading score an essay can get. */
const MIN_GRADING_SCORE = 1;
/** The maximum grading score an essay can get. */
const MAX_GRADING_SCORE = 4;

/**
 * Calculates line of best fit given an array of points.
 * @param points the array of points
 * @returns line of best fit function
 */
const computeLineOfBestFit = (points: [number, number][]): ((x: number) => number) => {
  let avgx = 0,
    avgy = 0,
    slopeNumerator = 0,
    slopeDenominator = 0,
    slope = 0,
    b = 0;

  points.forEach(([x, y]) => {
    avgx += x;
    avgy += y;
  });

  avgx /= points.length;
  avgy /= points.length;

  points.forEach(([x, y]) => {
    slopeNumerator += (x - avgx) * (y - avgy);
    slopeDenominator += (x - avgx) * (x - avgx);
  });

  if (slopeDenominator === 0) {
    console.warn("Unexpected condition: slope denominator is zero... returning identity map");
    return x => x;
  }

  slope = slopeNumerator / slopeDenominator;
  b = avgy - slope * avgx;

  return x => slope * x + b;
};

/**
 * Takes in an array of points, and uses a line of best fit to create a mapping
 * @param points the array of points
 * @returns interpolated mapping of points as an object
 */
const interpolateValuePairs = (points: [number, number][]) => {
  const line = computeLineOfBestFit(points);
  const adjustedMap: Map<string, number> = new Map<string, number>();

  for (let i: number = MIN_GRADING_SCORE; i <= MAX_GRADING_SCORE; i++) {
    let val = Number(line(i).toFixed(2));
    if (val > MAX_GRADING_SCORE) {
      val = MAX_GRADING_SCORE;
    } else if (val < MIN_GRADING_SCORE) {
      val = MIN_GRADING_SCORE;
    }
    val = Math.round(val * 2) / 2;
    adjustedMap.set(i.toString(), val);
  }

  // In case the line of best fit is downward sloping, we need to flip the mapping
  if (
    adjustedMap.get(MAX_GRADING_SCORE.toString())! < adjustedMap.get(MIN_GRADING_SCORE.toString())!
  ) {
    const flippedMap: Map<string, number> = new Map<string, number>();
    let start = MIN_GRADING_SCORE;
    let end = MAX_GRADING_SCORE;
    while (start <= end) {
      flippedMap.set(start.toString(), adjustedMap.get(end.toString())!);
      flippedMap.set(end.toString(), adjustedMap.get(start.toString())!);
      start++;
      end--;
    }
    return flippedMap;
  }

  return adjustedMap;
};

/**
 * Given two arrays of criteria scores, computes the calibration mapping.
 *
 * @param graderCriteriaScores
 * @param groundTruthCriteriaScores
 * @returns calibration mapping
 */

const computeCalibrationMapping = (
  graderCriteriaScores: CriteriaScores,
  groundTruthCriteriaScores: CriteriaScores,
  gradingGroup: GradingGroupType
) => {
  if (graderCriteriaScores.length !== groundTruthCriteriaScores.length) {
    throw new Error("Number of grader scores does not match number of ground truth scores.");
  }

  const calibrationMapping = Array.from(Object.keys(rubricMapping[gradingGroup])).map(criteria => {
    const graderScores = graderCriteriaScores
      .filter(score => score.criteria === criteria)
      .map(score => score.score);
    const groundTruthScores = groundTruthCriteriaScores
      .filter(score => score.criteria === criteria)
      .map(score => score.score);

    // console.log(`graderCriteriaScores: ${  graderCriteriaScores}`);

    // console.log(`graderScores after filter & mapping: ${  graderScores}`);

    if (!graderScores || !groundTruthScores) {
      throw new Error(`Could not find scores for criteria ${criteria}`);
    }

    graderScores.forEach((score, index) => {
      if (Number.isNaN(score)) {
        console.log(`Found NaN at criteria ${criteria}:`, score);
        throw new Error(`Invalid score ${score} found in graderScores for criteria ${criteria}`);
      }
    });

    const scoreMappings = interpolateValuePairs(
      _.zip(graderScores, groundTruthScores) as [number, number][]
    );

    return {
      criteria,
      scoreMappings,
    };
  });

  return calibrationMapping;
};

/**
 * Given two arrays of criteria scores, returns the calibration mapping.
 *
 * @param graderCalibrationScores
 * @param gradingGroup
 * @returns calibration mapping
 */

export const getCalibrationMapping = async (
  graderCalibrationScores: CriteriaScores,
  gradingGroup: GradingGroupType
) => {
  let groundTruthCalibrationScores: CriteriaScores = [];
  for (const [group, questions] of Object.entries(calibrationQuestionMapping)) {
    if (group === gradingGroup && Array.isArray(questions)) {
      groundTruthCalibrationScores = questions.map(question => ({
        criteria: question.criteria,
        score: question.score as number,
      }));
    }
  }

  return computeCalibrationMapping(
    graderCalibrationScores,
    groundTruthCalibrationScores,
    gradingGroup
  );
};
