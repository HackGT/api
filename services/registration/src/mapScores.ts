import fs from "fs";
import path from "path";

const calibrationmapping = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./config/calibrationmapping.json"), "utf8")
);
const groupmapping = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./config/groupmapping.json"), "utf8")
);

const criteriamapping = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./config/criteriamapping.json"), "utf8")
);

const rubricmapping = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./config/rubricmapping.json"), "utf8")
);

function getObjectFromMap<T>(mapping: Map<number, T>): { [key: number]: T } {
  const objectMap: { [key: number]: T } = {};

  for (const [key, value] of mapping) {
    objectMap[key] = value;
  }

  return objectMap;
}

function insertIntoMapAsArray(map: Map<number, number[]>, key: number, value: number): void {
  const list = map.get(key);
  if (list) {
    list.push(value);
  } else {
    map.set(key, [value]);
  }
}

// function avgListValueInMap(avgMap: Map<number, number[]>): Map<number, number> {
//     const newMap = new Map<number, number>();
//     Array.from(avgMap.keys()).map(key => {
//         const list = avgMap.get(key);
//         if (list) {
//             let avg = 0;
//             for (const item of list) {
//                 avg += item;
//             }
//             avg /= list.length;
//             newMap.set(key, avg);
//         }
//     });
//     return newMap;
// }

function lineOfBestFit(points: number[][]): (x: number) => number {
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
    return (x: number): number => x;
  } 
    slope = slopeNumerator / slopeDenominator;
  

  b = avgy - slope * avgx;

  return (x: number): number => slope * x + b;
}

function interpolateMap(map: Map<number, number[]>, from: number, to: number): Map<number, number> {
  const points: [number, number][] = [];

  for (const pointSet of map.entries()) {
    for (const point of pointSet[1]) {
      points.push([pointSet[0], point]);
    }
  }
  const line = lineOfBestFit(points);
  const adjustedMap: Map<number, number> = new Map();

  for (let i = from; i <= to; i++) {
    let val = Number(line(i).toFixed(2));
    if (val > to) {
      val = to;
    } else if (val < from) {
      val = from;
    }
    val = Math.round(val * 2) / 2;
    adjustedMap.set(i, val);
  }
  return adjustedMap;
}

function processValuePairs(valuePairs: [number, number][], minScore = 1, maxScore = 4) {
  const map = new Map<number, number[]>();

  for (const [x, y] of valuePairs) {
    insertIntoMapAsArray(map, x, y);
  }

  const refinedMap = interpolateMap(map, minScore, maxScore);

  return getObjectFromMap(refinedMap);
}

function mapCalibrationScores(
  calibrationScores: { group: string; score: number }[],
  mapScores: { group: string; score: number; criteria: string }[]
) {
  const s: { [key: string]: { [key: number]: number } } = {};
  const criteriaDict: { [key: string]: any[] } = {};

  for (const group of Object.keys(groupmapping)) {
    const regulargroupscores = calibrationScores.filter(val => val.group === group);
    const mappedScores = mapScores.filter(val => val.group === group);

    if (regulargroupscores.length === mappedScores.length) {
      const track = groupmapping[group].tracks[0];
      const criterias: string[] = Object.keys(criteriamapping[track]);

      for (let i = 0; i < criterias.length; i++) {
        criteriaDict[criterias[i]] = [];
      }

      for (let i = 0; i < mappedScores.length; i++) {
        if (!mappedScores[i].score || !regulargroupscores[i].score) {
          throw Error("Config is not correct format. Group name is incorrect.");
        }

        criteriaDict[mappedScores[i].criteria].push([
          mappedScores[i].score,
          regulargroupscores[i].score,
        ]);
      }
      for (let i = 0; i < criterias.length; i++) {
        if (regulargroupscores.length === mappedScores.length) {
          const min = 1;
          let max = 4;
          rubricmapping.forEach(
            (element: { name: string; calibrationRubric: { number: number } }) => {
              if (element.name === criterias[i]) {
                const len = Object.keys(element.calibrationRubric).length;
                max = len;
              }
            }
          );
          s[criterias[i]] = processValuePairs(criteriaDict[criterias[i]], min, max);
        }
      }
    }
  }

  return s;
}

export async function getScoreMapping(calibrationScores: { group: string; score: number }[]) {
  const mappedScores: any[] = [];
  for (const [key, value] of Object.entries(calibrationmapping)) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        const val = { group: key, score: item.score, criteria: item.name };
        mappedScores.push(val);
      });
    }
  }

  const mp = mapCalibrationScores(calibrationScores, mappedScores);
  const mappings: {
    criteria: string;
    scoreMappings: { [key: number]: number };
  }[] = [];

  if (mp) {
    for (const key of Object.keys(mp)) {
      mappings.push({
        criteria: key,
        scoreMappings: mp[key],
      });
    }
  }

  return mappings;
}
