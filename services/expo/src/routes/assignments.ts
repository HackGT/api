import express from "express";
import { asyncHandler, BadRequestError } from "@api/common";

import { prisma } from "../common";
import { getConfig, isAdminOrIsJudging } from "../utils/utils";
import { User, AssignmentStatus, Assignment, Prisma } from "@api/prisma-expo/generated";

const autoAssign = async (judgeId: number, isStarted: boolean): Promise<Assignment | null> => {
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

  // get config info
  const config = await getConfig();

  if (!config.currentHexathon) {
    throw new Error("Current hexathon is not setup yet.");
  }

  // get judge info
  const judgeToAssign = await prisma.user.findUnique({
    where: {
      id: judgeId,
    },
    select: {
      id: true,
      isJudging: true,
      categoryGroup: {
        select: {
          id: true,
          categories: true,
        },
      },
    },
  });

  if (judgeToAssign == null) {
    throw new Error("Judge does not exist");
  }
  if (!judgeToAssign.isJudging) {
    throw new Error("User is not a judge");
  }
  if (judgeToAssign.categoryGroup == null) {
    throw new Error("Judge is not aligned to a category group");
  }

  // get categoryIds from the judge's category group
  const judgeCategoryIds = judgeToAssign.categoryGroup.categories.map(category => category.id);

  // where clause for finding projects
  const projectFilter: Prisma.ProjectWhereInput = {
    hexathon: config.currentHexathon,
    expo: config.currentExpo,
    round: config.currentRound,
    categories: {
      some: {
        id: { in: judgeCategoryIds },
      },
    },
    assignment: {
      none: {
        userId: judgeToAssign.id,
      },
    },
  };

  // if the judge is aligned to a default category, then the judge can judge any project
  // so we do not need to filter projects by category anymore
  const defaultCategories = judgeToAssign.categoryGroup.categories.filter(
    category => category.isDefault
  );
  if (defaultCategories.length > 0) {
    delete projectFilter.categories;
  }

  // get projects from the appropriate expo/round, where at least some of the project's categories match the judge's categories
  // and where the project has not been assigned to the judge before
  const projectsWithMatchingCategories = await prisma.project.findMany({
    select: {
      id: true,

      // get assignments where at least some of the project's categories match the judge's categories
      assignment: {
        select: {
          categoryIds: true,
        },
        where: {
          categoryIds: {
            hasSome: judgeCategoryIds,
          },
        },
      },
      categories: true,
    },
    where: projectFilter,
  });

  if (projectsWithMatchingCategories.length === 0) {
    return null;
  }

  // sort projects by number of assignments that match the judge's categories
  projectsWithMatchingCategories.sort((p1, p2) => p1.assignment.length - p2.assignment.length);

  const assignmentCount = projectsWithMatchingCategories[0].assignment.length;
  const sameSortProjects = projectsWithMatchingCategories.filter(
    proj => proj.assignment.length === assignmentCount
  );

  const selectedProject = sameSortProjects[Math.floor(Math.random() * sameSortProjects.length)];

  if (!selectedProject) {
    return null;
  }

  // pick the highest priority project based on sorting above
  let categoriesToJudge = selectedProject.categories.filter(category =>
    judgeCategoryIds.includes(category.id)
  );

  // add default categories (if any)
  if (defaultCategories.length > 0) {
    categoriesToJudge = categoriesToJudge.concat(defaultCategories);
  }
  const createdAssignment = await prisma.assignment.create({
    data: {
      userId: judgeToAssign.id,
      projectId: selectedProject.id,
      status: isStarted ? AssignmentStatus.STARTED : AssignmentStatus.QUEUED,
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
      filter.project.categories = { every: { hexathon } };
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
    const user = await prisma.user.findUnique({
      where: {
        userId: req.user?.uid ?? "",
      },
      include: {
        categoryGroup: {
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
    if (!user.isJudging) {
      throw new BadRequestError("User is not a judge");
    }
    if (!user.categoryGroup) {
      throw new BadRequestError("Please assign a category group to this user first.");
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        userId: user.id,
        status: { in: ["STARTED", "QUEUED"] },
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

    const config = await getConfig();

    // eslint-disable-next-line no-async-promise-executor
    const assignment: Assignment | null = await new Promise(async (resolve, reject) => {
      // call auto assign if judging is on and there are no assignments
      if (config.isJudgingOn && assignments.length === 0) {
        await autoAssign(user.id, true)
          .then(newAssignment => {
            resolve(newAssignment);
          })
          .catch(err => {
            reject(err);
          });
      } else if (assignments.length > 0) {
        // return the started assignment if it exists
        // otherwise, return the first queued assignment (after changing its status to started)
        let startedAssignment;
        startedAssignment = assignments.find(
          assignment => assignment.status === AssignmentStatus.STARTED
        );

        if (!startedAssignment) {
          startedAssignment = await prisma.assignment.update({
            where: {
              id: assignments[0].id,
            },
            data: {
              status: AssignmentStatus.STARTED,
            },
          });
        }
        resolve(startedAssignment);
      } else {
        resolve(null);
      }
    });

    // auto assign returns null if there are no projects to assign to the judge
    if (assignment === null) {
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
    const filteredCategories = user.categoryGroup.categories.filter(
      category => project?.categories.some(c => c.id === category.id) || category.isDefault
    );

    const updatedProject = {
      ...project,
      categories: filteredCategories,
      assignment,
    };
    res.status(200).json(updatedProject);
  })
);

assignmentRoutes.route("/").post(
  isAdminOrIsJudging,
  asyncHandler(async (req, res) => {
    const user: User = req.body.user as User;
    const projectId: number = parseInt(req.body.project.id);
    const duplicateFilter: any = {};

    duplicateFilter.projectId = projectId;
    duplicateFilter.userId = user.id;
    duplicateFilter.status = AssignmentStatus.STARTED;

    const checkAssignment = await prisma.assignment.findMany({
      where: {
        userId: duplicateFilter.userId,
        projectId: duplicateFilter.projectId,
      },
    });
    if (checkAssignment.length !== 0 && checkAssignment[0].status === "STARTED") {
      throw new BadRequestError("Judge is already judging this project.");
    } else if (checkAssignment.length !== 0 && checkAssignment[0].status === "COMPLETED") {
      throw new BadRequestError("Judge has already judged this project.");
    }

    let createdAssignment;
    if (checkAssignment.length === 0) {
      createdAssignment = await prisma.assignment.create({
        data: req.body.data,
      });
      res.status(201).json(createdAssignment);
    }

    const checkAnyAssignmentStarted = await prisma.assignment.findMany({
      where: {
        userId: duplicateFilter.userId,
        status: AssignmentStatus.STARTED,
      },
    });

    if (checkAnyAssignmentStarted.length !== 0) {
      const updateOldAssignment = await prisma.assignment.update({
        where: {
          id: checkAnyAssignmentStarted[0].id,
        },
        data: {
          status: AssignmentStatus.QUEUED,
        },
      });
      if (checkAssignment.length !== 0) {
        const updatedAssignment = await prisma.assignment.update({
          where: {
            id: checkAssignment[0].id,
          },
          data: {
            status: AssignmentStatus.STARTED,
          },
        });

        res.status(201).json(updatedAssignment);
      } else if (typeof createdAssignment !== "undefined") {
        const updatedAssignment = await prisma.assignment.update({
          where: {
            id: createdAssignment.id,
          },
          data: {
            status: AssignmentStatus.STARTED,
          },
        });
        res.status(201).json(updatedAssignment);
      }
    }
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
    try {
      const createdAssignment = await autoAssign(req.body.judge, true);
      if (createdAssignment === null) {
        res.status(200).json(createdAssignment);
      } else {
        res.status(201).json(createdAssignment);
      }
    } catch (err: any) {
      res.status(500).json({
        error: true,
        message: err.message,
      });
    }
  })
);
