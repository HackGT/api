import { ConfigError } from "@api/common";

import { calibrationQuestionMapping, rubricMapping } from "../config";

type UserScoresByGroup = {
  [group: string]: {
    score: number;
  }[];
};

type GroundTruthScoresByGroup = {
  [group: string]: {
    score: number;
    criteria: string;
  }[];
};

/** The minimum grading score an essay can get. */
const MIN_GRADING_SCORE = 1;
/** The maximum grading score an essay can get. */
const MAX_GRADING_SCORE = 4;

/**
 * Calculates line of best fit given an array of points.
 * @param points the array of points
 * @returns line of best fit function
 */
function computeLineOfBestFit(points: number[][]): (x: number) => number {
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
}

/**
 * Takes in an array of points, and uses a line of best fit to create a mapping
 * @param points the array of points
 * @param from minimum value of the mapping
 * @param to maximum value of the mapping
 * @returns interpolated mapping of points as an object
 */
function interpolateValuePairs(points: [number, number][], from: number, to: number) {
  const line = computeLineOfBestFit(points);
  const adjustedMap: { [key: number]: number } = {};

  for (let i = from; i <= to; i++) {
    let val = Number(line(i).toFixed(2));
    if (val > to) {
      val = to;
    } else if (val < from) {
      val = from;
    }
    val = Math.round(val * 2) / 2;
    adjustedMap[i] = val;
  }

  return adjustedMap;
}

/**
 * Computes calibration scores for user by a grading group. For each group, each user's scores are
 * compared against the ground truth value. Then, using a line of best fit,
 * a mapping is computed for each criteria from a user's score to an adjusted score to account for bias.
 * @param userScoresByGroup the user's calibration scores
 * @param groundTruthScoresByGroup the ground truth scores
 * @returns a mapping of criteria to adjusted scores by criteria
 */
function mapCalibrationScores(
  userScoresByGroup: UserScoresByGroup,
  groundTruthScoresByGroup: GroundTruthScoresByGroup
) {
  // Gets score pairs for user and ground truth by criteria
  const scorePairsByCriteria: { [criteria: string]: [number, number][] } = {};
  const finalCalibrationScores: {
    criteria: string;
    scoreMappings: { [key: number]: number };
  }[] = [];

  for (const group of Object.keys(userScoresByGroup)) {
    const userScores = userScoresByGroup[group];
    const groundTruthScores = groundTruthScoresByGroup[group];

    if (userScores.length !== groundTruthScores.length) {
      throw new ConfigError(
        `Number of scores for group ${group} does not match ground truth length.`
      );
    }

    // Computes all the criteria for each of the branches in this group. Since some of the criteria
    // may overlap, a set is used to prevent duplicates.
    const allCriteriasSet = new Set<string>();
    // TODO: Needs to be updated since we aren't mapping by branch anymore, but by criteria
    // for (const branch of gradingGroupMapping[group].branches) {
    //   Object.keys(rubricMapping[branch]).forEach(criteria => allCriteriasSet.add(criteria));
    // }
    const criterias = Array.from(allCriteriasSet);

    for (const criteria of criterias) {
      scorePairsByCriteria[criteria] = [];
    }

    for (let i = 0; i < groundTruthScores.length; i++) {
      if (!userScores[i].score || !groundTruthScores[i].score) {
        throw new ConfigError(
          "Config is not correct format. Score mismatch between user and ground truth."
        );
      }

      scorePairsByCriteria[groundTruthScores[i].criteria].push([
        groundTruthScores[i].score,
        userScores[i].score,
      ]);
    }

    for (const criteria of criterias) {
      finalCalibrationScores.push({
        criteria,
        scoreMappings: interpolateValuePairs(
          scorePairsByCriteria[criteria],
          MIN_GRADING_SCORE,
          MAX_GRADING_SCORE
        ),
      });
    }
  }

  return finalCalibrationScores;
}

/**
 * Gets calibration score mappings for a user. Using the ground truth values from the config,
 * this function computes the proper calibration score for each criteria.
 * @param userScores The calibration scores for the user
 */
export async function getScoreMapping(
  userScores: {
    group: string;
    score: number;
  }[]
) {
  // Compute ground truth scores by group from calibration question mappings
  const groundTruthScoresByGroup: GroundTruthScoresByGroup = {};
  for (const [gradingGroup, questions] of Object.entries(calibrationQuestionMapping)) {
    if (Array.isArray(questions)) {
      const groupScores = questions.map(question => ({
        score: question.score as number,
        criteria: question.criteria as string,
      }));
      groundTruthScoresByGroup[gradingGroup] = groupScores;
    }
  }

  // Compute user scores by group from provided user scores
  const userScoresByGroup: UserScoresByGroup = {};
  for (const userScore of userScores) {
    if (!userScoresByGroup[userScore.group]) {
      userScoresByGroup[userScore.group] = [];
    }
    userScoresByGroup[userScore.group].push({
      score: userScore.score,
    });
  }

  return mapCalibrationScores(userScoresByGroup, groundTruthScoresByGroup);
}
