import express from "express";
import { createHash } from "crypto";
import { asyncHandler, BadRequestError, ConfigError, getAllSmallest } from "@api/common";

import { prisma } from "../common";
import { getConfig, isAdminOrIsJudging } from "../utils/utils";
import { AssignmentStatus, Assignment, Prisma } from "@api/prisma-expo/generated";

const autoAssign = async (judgeId: number): Promise<Assignment | null> => {
  // We are not selecting a random judge for auto-assign
  // Instead, auto-assign is called when a judge has no projects currently assigned
  /*
  // get judges
  const judges = await prisma.user.findMany({
    select: {
      id: true,
      categoryGroup: {
        select: {
          id: true,
          categories: true
        }
      }
    },
    where: {
      isJudging: true,
    }
  });

  // see which judges already have queued (but not started) projects
  const assignments = await prisma.assignment.findMany({
    select: {
      userId: true,
    },
    where: {
      OR: [
        // {
        //   status: AssignmentStatus.STARTED,
        // },
        {
          status: AssignmentStatus.QUEUED
        }
      ]
    }
  });

  // we define a judge as available if they do not have any queued projects
  const availableJudges = judges.filter(judge => !assignments.includes({ userId: judge.id }));

  if (availableJudges.length == 0) {
    return res.status(200).json({
      error: "No available judges",
    });
  }

  // pick a random judge
  const judgeToAssign = availableJudges[Math.floor(Math.random() * availableJudges.length)];
  */

  const config = await getConfig();
  if (!config.currentHexathon) {
    throw new ConfigError("Current hexathon is not setup yet.");
  }

  // Get judge info with assigned category group for current hexathon
  const judgeToAssign = await prisma.user.findUnique({
    where: {
      id: judgeId,
      categoryGroups: {
        some: {
          hexathon: config.currentHexathon,
        },
      },
    },
    include: {
      categoryGroups: {
        include: {
          categories: true,
        },
      },
    },
  });
  if (judgeToAssign == null) {
    throw new BadRequestError("Judge not found with assigned category group for current hexathon");
  }

  // Get categoryIds from the judge's category group for current hexathon
  const judgeCategories = judgeToAssign.categoryGroups.find(
    categoryGroup => categoryGroup.hexathon === config.currentHexathon
  )?.categories;
  if (!judgeCategories) {
    throw new BadRequestError("Invalid category group for this judge");
  }

  // const startedAssignments = await prisma.assignment.findMany({
  //   where: {
  //     userId: judgeToAssign.id,
  //     status: AssignmentStatus.STARTED,
  //     project: {
  //       hexathon: config.currentHexathon,
  //     },
  //   },
  // });

  // if (startedAssignments.length !== 0) {
  //   isStarted = false;
  // }

  const defaultCategories = judgeCategories.filter(category => category.isDefault);

  return await prisma.$transaction(async tx => {
    // Scoped advisory lock: serializes auto-assign calls for the same
    // hexathon/expo/round so unrelated contexts don't contend on the same lock
    // have to use a goofy hash because no strings
    const lockKey = createHash("sha256")
      .update(`${config.currentHexathon}:${config.currentExpo}:${config.currentRound}`)
      .digest()
      .readBigInt64BE(0);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

    const projectFilter: Prisma.ProjectWhereInput = {
      hexathon: config.currentHexathon!,
      expo: config.currentExpo,
      round: config.currentRound,
      assignment: { none: { userId: judgeToAssign.id } },
    };

    if (defaultCategories.length === 0) {
      projectFilter.categories = {
        some: { id: { in: judgeCategories.map(c => c.id) } },
      };
    }

    // Fetch *all* assignments for each candidate project,
    // we'll compute category-overlap counts manually so we dont miss queued
    // assignments from other judges for non-overlapping categories (thx copilot)
    const projects = await tx.project.findMany({
      where: projectFilter,
      select: {
        id: true,
        categories: true,
        assignment: {
          select: { categoryIds: true, status: true },
        },
      },
    });

    // Only eligible if no judge is currently assigned (QUEUED)
    const eligible = projects.filter(p => {
      const queued = p.assignment.filter(a => a.status === "QUEUED").length;
      return queued === 0;
    });
    if (eligible.length === 0) return null;

    const judgeCategoryIds = judgeCategories.map(c => c.id);

    // select a random project among the ones that have the least "relevant" assignments
    // Count only completed assignments that ALSO overlap the judge's categories.
    // If an assignment is completed but none of the categories overlap, we can still
    // be comfortable judging this project (so that asmt won't count toward this total)
    // tldr: higher completedCount = less chance of being judged
    const completedCount = (proj: (typeof eligible)[number]) =>
      proj.assignment.filter(
        asmt =>
          asmt.status === "COMPLETED" && asmt.categoryIds.some(id => judgeCategoryIds.includes(id))
      ).length;
    const candidates = getAllSmallest(eligible, completedCount);
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    const alreadyQueued = selected.assignment.filter(a => a.status === "QUEUED").length;
    if (alreadyQueued > 0) {
      console.warn(
        `----- [CONCURRENT] Project ${selected.id} assigned to judge ${judgeId} while already QUEUED by ${alreadyQueued} other judge(s)`
      );
    }

    let categoriesToJudge = selected.categories.filter(c => judgeCategoryIds.includes(c.id));
    if (defaultCategories.length > 0) {
      categoriesToJudge = categoriesToJudge.concat(defaultCategories);
    }

    return await tx.assignment.create({
      data: {
        userId: judgeToAssign.id,
        projectId: selected.id,
        status: AssignmentStatus.QUEUED,
        categoryIds: categoriesToJudge.map(c => c.id),
      },
    });
  });
};

export const assignmentRoutes = express.Router();

assignmentRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const { hexathon, expo, round, categoryGroup } = req.query;
    const filter: any = {};
    if (hexathon || expo || round) {
      filter.project = {};
    }

    if (hexathon !== undefined) {
      filter.project.hexathon = hexathon;
    }

    if (expo !== undefined) {
      const expoNumber: number = parseInt(expo as string);
      filter.project.expo = expoNumber;
    }

    if (round !== undefined) {
      const roundNumber: number = parseInt(round as string);
      filter.project.round = roundNumber;
    }

    if (categoryGroup !== undefined) {
      const categoryGroupId: number = parseInt(categoryGroup as string);
      filter.user = {
        categoryGroupId,
      };
    }

    const assignments = await prisma.assignment.findMany({
      where: filter,
    });
    res.status(200).json(assignments);
  })
);

assignmentRoutes.route("/current-project").get(
  asyncHandler(async (req, res) => {
    const config = await getConfig();
    if (!config.currentHexathon) {
      throw new Error("Current hexathon is not setup yet.");
    }

    const user = await prisma.user.findUnique({
      where: {
        userId: req.user?.uid ?? "",
        categoryGroups: {
          some: {
            hexathon: config.currentHexathon,
          },
        },
      },
      include: {
        categoryGroups: {
          include: {
            categories: {
              include: {
                criterias: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestError("Invalid user");
    }

    const currentAssignments = await prisma.assignment.findMany({
      where: {
        userId: user.id,
        status: AssignmentStatus.QUEUED,
        project: {
          hexathon: config.currentHexathon,
        },
      },
      orderBy: [
        {
          createdAt: "asc",
        },
        {
          priority: "desc",
        },
      ],
    });

    let assignment;
    if (config.isJudgingOn && currentAssignments.length === 0) {
      // Call auto assign if judging is on and there are no assignments
      assignment = await autoAssign(user.id);
    } else if (currentAssignments.length > 0) {
      assignment = currentAssignments[0]; // eslint-disable-line prefer-destructuring
    }

    // auto assign returns null if there are no projects to assign to the judge
    if (!assignment) {
      res.status(200).json();
      return;
    }

    const project = await prisma.project.findUnique({
      where: {
        id: assignment.projectId,
      },
      include: {
        categories: { include: { criterias: true } },
      },
    });

    // filter categories to only include categories that the judge is assigned to
    const filteredCategories = user.categoryGroups
      .find(categoryGroup => categoryGroup.hexathon === config.currentHexathon)
      ?.categories.filter(
        category => project?.categories.some(c => c.id === category.id) || category.isDefault
      );

    const assignedProject = {
      ...project,
      categories: filteredCategories,
      assignment,
    };
    res.status(200).json(assignedProject);
  })
);

assignmentRoutes.route("/").post(
  isAdminOrIsJudging,
  asyncHandler(async (req, res) => {
    const config = await getConfig();
    if (!config.currentHexathon) {
      throw new Error("Current hexathon is not setup yet.");
    }

    const [judge, project] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: req.body.user,
          categoryGroups: {
            some: {
              hexathon: config.currentHexathon,
            },
          },
        },
        include: {
          categoryGroups: {
            include: {
              categories: true,
            },
          },
        },
      }),
      prisma.project.findUnique({
        where: {
          id: req.body.project,
          hexathon: config.currentHexathon,
        },
        include: {
          categories: true,
        },
      }),
    ]);
    if (!judge) {
      throw new BadRequestError(
        "Judge not found with assigned category group for current hexathon"
      );
    }
    if (!project) {
      throw new BadRequestError("Invalid project provided");
    }

    const existingAssignmentForProject = await prisma.assignment.findFirst({
      where: {
        userId: req.body.user,
        projectId: req.body.project,
      },
    });

    if (existingAssignmentForProject?.status === AssignmentStatus.QUEUED) {
      throw new BadRequestError("Judge already has this project queued");
    } else if (existingAssignmentForProject?.status === AssignmentStatus.COMPLETED) {
      throw new BadRequestError("Judge has already judged this project.");
    }

    // Create judging categories if category is default or project has category
    const categoriesToJudge = judge.categoryGroups[0].categories
      .filter(category => category.isDefault || project.categories.some(c => c.id === category.id))
      .map(category => category.id);

    const upsertAssignment = await prisma.assignment.upsert({
      where: {
        id: existingAssignmentForProject?.id ?? -1,
      },
      update: {
        status: AssignmentStatus.QUEUED,
        categoryIds: {
          set: categoriesToJudge,
        },
      },
      create: {
        userId: req.body.user,
        projectId: req.body.project,
        status: AssignmentStatus.QUEUED,
        categoryIds: categoriesToJudge,
      },
    });
    res.status(200).json(upsertAssignment);
  })
);

assignmentRoutes.route("/:id").patch(
  isAdminOrIsJudging,
  asyncHandler(async (req, res) => {
    const updatedAssignment = await prisma.assignment.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: req.body.data,
    });

    res.status(200).json(updatedAssignment);
  })
);

assignmentRoutes.route("/autoAssign").post(
  isAdminOrIsJudging,
  asyncHandler(async (req, res) => {
    const createdAssignment = await autoAssign(req.body.judge);
    res.status(200).json(createdAssignment);
  })
);
