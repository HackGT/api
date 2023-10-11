import express from "express";
import { asyncHandler, BadRequestError, ConfigError } from "@api/common";

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

  // Where clause for finding projects
  const projectFilter: Prisma.ProjectWhereInput = {
    hexathon: config.currentHexathon,
    expo: config.currentExpo,
    round: config.currentRound,
    assignment: {
      none: {
        userId: judgeToAssign.id,
      },
    },
  };

  // If the judge's category group doesn't have a default category, we need to add
  // in the project filter. Otherwise, the judge can judge any project.
  const defaultCategories = judgeCategories.filter(category => category.isDefault);
  if (defaultCategories.length === 0) {
    projectFilter.categories = {
      some: {
        id: { in: judgeCategories.map(category => category.id) },
      },
    };
  }

  // Get projects from the appropriate expo/round, where at least some of the project's categories match
  // the judge's categories and where the project has not been assigned to the judge before
  const projectsWithMatchingCategories = await prisma.project.findMany({
    where: projectFilter,
    select: {
      id: true,
      assignment: {
        select: {
          categoryIds: true,
        },
        where: {
          categoryIds: {
            hasSome: judgeCategories.map(category => category.id),
          },
        },
      },
      categories: true,
    },
  });

  if (projectsWithMatchingCategories.length === 0) {
    return null;
  }

  // Sort projects by number of assignments that match the judge's categories
  projectsWithMatchingCategories.sort((p1, p2) => p1.assignment.length - p2.assignment.length);

  // Find the project(s) with the lowest number of assignments that match the judge's categories
  // Then, pick a random project from the projects with the lowest number of assignments
  const lowestAssignmentCount = projectsWithMatchingCategories[0].assignment.length;
  const projectsWithLowestAssignmentCount = projectsWithMatchingCategories.filter(
    proj => proj.assignment.length === lowestAssignmentCount
  );
  const selectedProject =
    projectsWithLowestAssignmentCount[
      Math.floor(Math.random() * projectsWithLowestAssignmentCount.length)
    ];

  // Filter categories to only include categories that the judge is assigned to.
  // If judge's category group judges a default category, add it to the categories to judge
  let categoriesToJudge = selectedProject.categories.filter(category =>
    judgeCategories.map(judgeCategory => judgeCategory.id).includes(category.id)
  );
  if (defaultCategories.length > 0) {
    categoriesToJudge = categoriesToJudge.concat(defaultCategories);
  }

  const createdAssignment = await prisma.assignment.create({
    data: {
      userId: judgeToAssign.id,
      projectId: selectedProject.id,
      status: AssignmentStatus.QUEUED,
      categoryIds: categoriesToJudge.map(category => category.id),
    },
  });
  return createdAssignment;
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
