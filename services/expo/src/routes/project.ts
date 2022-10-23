/* eslint-disable guard-for-in */
import express from "express";
import { Project, TableGroup } from "@prisma/client";
import { apiCall, asyncHandler, BadRequestError } from "@api/common";
import { Service } from "@api/config";

import { prisma } from "../common";
import { getConfig, getCurrentHexathon } from "../utils/utils";
import {
  validateTeam,
  validateDevpost,
  validatePrizes,
  getEligiblePrizes,
} from "../utils/validationHelpers";
import { isAdmin } from "../auth/auth";

export const projectRoutes = express.Router();

projectRoutes.route("/").get(
  asyncHandler(async (req: any, res) => {
    const { expo, round, table, category, hexathon } = req.query;

    const filter: any = {};
    if (expo) filter.expo = parseInt(expo as string);
    if (round) filter.round = parseInt(round as string);
    if (table) filter.table = parseInt(table as string);
    if (category) filter.category = parseInt(category as string);
    if (hexathon) filter.hexathon = hexathon;

    const matches = await prisma.project.findMany({
      where: filter,
      include: {
        categories: {
          include: {
            categoryGroups: true,
          },
        },
        ballots: {
          select: {
            id: true,
            score: true,
            user: true,
            criteria: true,
          },
        },
        members: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    res.status(200).json(matches);
  })
);

projectRoutes.route("/special/team-validation").post(async (req, res) => {
  const resp = await validateTeam(req.user, req.body.members, req);
  if (resp.error) {
    res.status(400).json(resp);
  } else {
    res.status(200).json(resp);
  }
});

// TODO: Fill in prize validation as needed
projectRoutes.route("/special/prize-validation").post(async (req, res) => {
  const resp = await validatePrizes(req.body.prizes, req);
  if (resp.error) {
    res.status(400).json(resp);
  } else {
    res.status(200).json(resp);
  }
});

// TODO: Fill in detail validation as needed
projectRoutes.route("/special/detail-validation").post(async (req, res) => {
  res.status(200).send({ error: false });
});

projectRoutes.route("/special/devpost-validation").post(async (req, res) => {
  const resp = await validateDevpost(req.body.devpostUrl, req.body.name);
  if (resp.error) {
    res.status(400).json(resp);
  } else {
    res.status(200).json(resp);
  }
});

projectRoutes.route("/special/get-eligible-prizes").get(async (req, res) => {
  const resp: any = await getEligiblePrizes([], req);
  if (resp.error) {
    res.status(400).json(resp);
  } else {
    res.status(200).json(resp);
  }
});

// Last step of the form, all the data is passed in here and a submission should be created
projectRoutes.route("/").post(async (req, res) => {
  const config = await getConfig();
  const currentHexathon = await getCurrentHexathon(req);

  if (!config.isProjectSubmissionOpen) {
    res.status(400).send({ error: true, message: "Sorry, submissions are currently closed" });
    return;
  }

  if (!req.body.submission) {
    res.status(400).send({ error: true, message: "Invalid submission" });
    return;
  }

  const data = req.body.submission;

  console.log(data);

  const teamValidation = await validateTeam(req.user, data.members, req);
  if (teamValidation.error) {
    res.status(400).send(teamValidation);
    return;
  }

  const devpostValidation = await validateDevpost(data.devpostUrl, data.name);
  if (devpostValidation.error) {
    res.status(400).send(devpostValidation);
    return;
  }

  // const bestOverall: any = await prisma.category.findFirst({
  //   where: {
  //     name: { in: ["HackGT - Best Overall"] },
  //   },
  // });

  // const openSource: any = await prisma.category.findFirst({
  //   where: {
  //     name: { in: ["HackGT - Best Open Source Hack"] },
  //   },
  // });

  // if (openSource && data.prizes.includes(openSource.id) && data.prizes.length > 1) {
  //   res.status(400).send({
  //     error: true,
  //     message: "If you submit to open source you can only submit to that category",
  //   });
  // } else if (openSource && !data.prizes.includes(openSource.id)) {
  //   data.prizes.push(bestOverall.id);
  // }

  const projectExpo = Math.floor(Math.random() * config.numberOfExpo + 1);

  const tableGroups = await prisma.tableGroup.findMany();
  const projectsInCurrentExpo = await prisma.project.findMany({
    where: {
      expo: projectExpo,
    },
  });

  let minCapacityTableGroup: undefined | TableGroup;
  let minCapacityValue = 1;

  for (const tableGroup of tableGroups) {
    const projectsInCurrentExpoAndTableGroup = projectsInCurrentExpo.filter(
      project => project.tableGroupId === tableGroup.id
    );
    if (
      projectsInCurrentExpoAndTableGroup.length < tableGroup.tableCapacity &&
      projectsInCurrentExpoAndTableGroup.length / tableGroup.tableCapacity < minCapacityValue
    ) {
      minCapacityTableGroup = tableGroup;
      minCapacityValue = projectsInCurrentExpoAndTableGroup.length / tableGroup.tableCapacity;
    }
  }

  if (!minCapacityTableGroup) {
    res.status(400).send({
      error: true,
      message:
        "Submission could not be saved due to issue with table groups - please contact help desk",
    });
    return;
  }

  const projectsInCurrentExpoAndTableGroup = projectsInCurrentExpo.filter(
    project => project.tableGroupId === minCapacityTableGroup?.id
  );

  let tableNumber;
  const tableNumberSet = new Set();
  for (const project of projectsInCurrentExpoAndTableGroup) {
    tableNumberSet.add(project.table);
  }
  for (let i = 1; i <= minCapacityTableGroup.tableCapacity; i++) {
    if (!tableNumberSet.has(i)) {
      tableNumber = i;
      break;
    }
  }

  if (!teamValidation.registrationUsers) {
    res.status(400).send({
      error: true,
      message: "There was an error contacting registration. Please contact help desk.",
    });
    return;
  }

  // in loop call all projects with table group id
  // find first available table
  try {
    await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        devpostUrl: data.devpostUrl,
        githubUrl: "",
        expo: projectExpo,
        roomUrl: "",
        table: tableNumber,
        hexathon: currentHexathon.id,
        members: {
          connectOrCreate: teamValidation.registrationUsers.map((application: any) => ({
            where: {
              email: application.email,
            },
            create: {
              userId: application.userId,
              name: application.name === undefined ? "" : application.name,
              email: application.email,
            },
          })),
        },
        categories: {
          connect: data.prizes.map((prizeId: any) => ({ id: prizeId })),
        },
        tableGroup: {
          connect: { id: minCapacityTableGroup.id },
        },
      },
    });

    const interactionPromises = teamValidation.registrationUsers.map((member: any) =>
      apiCall(
        Service.HEXATHONS,
        {
          method: "POST",
          url: `/interactions`,
          data: {
            hexathon: currentHexathon.id,
            userId: member.userId,
            type: "expo-submission",
          },
        },
        req
      )
    );

    const response = await Promise.all(interactionPromises);

    console.log(response);
  } catch (err) {
    console.error(err);
    res.status(400).send({
      error: true,
      message: "Submission could not be saved - please contact help desk",
    });
    return;
  }

  res.status(200).send({ error: false });
});

projectRoutes.route("/batch/update").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const { ids, ...updates } = req.body;
    const batchPayload = await prisma.project.updateMany({
      where: { id: { in: ids } },
      data: updates,
    });
    res.status(200).json(batchPayload);
  })
);

projectRoutes.route("/:id").patch(
  isAdmin,
  asyncHandler(async (req, res) => {
    let members: any[] = [];
    let categories: any[] = [];
    let tableGroup;

    const config = await getConfig();
    const currentProject = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    const expo: number = req.body.expo || currentProject?.expo;

    if (req.body.members) {
      members = req.body.members;
      delete req.body.members;
    }

    if (req.body.categories) {
      categories = req.body.categories;
      delete req.body.categories;
    }

    if (req.body.tableGroupId) {
      tableGroup = parseInt(req.body.tableGroupId);
      delete req.body.tableGroupId;

      if (tableGroup !== currentProject?.tableGroupId) {
        // reassign
      }
    }

    if (req.body.table) {
      const tableNumber = parseInt(req.body.table);
      const projectsInSameGroup = await prisma.project.findMany({
        where: { tableGroupId: tableGroup, expo },
      });

      const tableGroups = await prisma.tableGroup.findMany();

      const maxTableCap = Math.max(...tableGroups.map((group: TableGroup) => group.tableCapacity));
      console.log("Max table cap", maxTableCap);
      if (tableNumber > maxTableCap) {
        res.status(200).send({
          error: true,
          message: "Error: Table Number Too Large.",
        });
        return;
      }

      const isDuplicate = projectsInSameGroup.some(
        project => project.id !== parseInt(req.params.id) && project.table === tableNumber
      );

      if (isDuplicate) {
        res.status(200).send({
          error: true,
          message: "Error: Duplicate Table Number.",
        });
        return;
      }
    }

    const dbCategories = await prisma.category.findMany({
      where: { name: { in: categories } },
    });

    categories = dbCategories.map((category: any) => ({ id: category.id }));

    if (tableGroup !== undefined) {
      const dbTableGroup = await prisma.tableGroup.findUnique({
        where: { id: tableGroup },
      });
      if (dbTableGroup !== null) {
        tableGroup = { id: dbTableGroup.id };
      }
    }

    let applications;
    try {
      applications = await Promise.all(
        members.map(async (member: any) =>
          apiCall(
            Service.REGISTRATION,
            {
              url: `/applications/actions/expo-user`,
              method: "GET",
              params: {
                hexathon: config.currentHexathon,
                email: member.email,
              },
            },
            req
          )
        )
      );
    } catch (err) {
      console.error(err);
      res.status(200).send({
        error: true,
        message: "Error getting registration information.",
      });
      return;
    }

    const updated = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...req.body,
        members: {
          connectOrCreate: applications.map((application: any) => ({
            where: {
              email: application.email,
            },
            create: {
              name: application.name,
              email: application.email,
              userId: application.userId,
            },
          })),
        },
        categories: {
          connect: categories,
        },
        tableGroup: {
          connect: tableGroup !== undefined ? tableGroup : { id: 1 },
        },
      },
      include: {
        categories: true,
        members: true,
        tableGroup: true,
      },
    });

    const membersToDisconnect: any[] = [];
    const categoriesToDisconnect: any[] = [];
    const memberEmailArr = members.map((member: any) => member.email);
    updated.members.forEach((member: any) => {
      if (!memberEmailArr.includes(member.email)) {
        membersToDisconnect.push({ email: member.email });
      }
    });
    const categoryIdArr = categories.map((category: any) => category.id);
    updated.categories.forEach((category: any) => {
      if (!categoryIdArr.includes(category.id)) {
        categoriesToDisconnect.push({ id: category.id });
      }
    });

    const disconnect = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: {
        members: {
          disconnect: membersToDisconnect,
        },
        categories: {
          disconnect: categoriesToDisconnect,
        },
      },
    });
    res.status(200).json(disconnect);
  })
);

projectRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        members: true,
        categories: true,
      },
    });

    const hexathon = await apiCall(
      Service.HEXATHONS,
      {
        url: `/hexathons/${project?.hexathon}`,
        method: "GET",
      },
      req
    );

    if (project) {
      project.hexathon = hexathon;
    }

    res.status(200).json(project);
  })
);

projectRoutes.route("/special/dashboard").get(
  asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.user?.uid,
          },
        },
      },
      include: {
        members: true,
        assignment: true,
      },
    });

    const hexathons = await apiCall(
      Service.HEXATHONS,
      {
        url: `/hexathons`,
        method: "GET",
      },
      req
    );

    for (const project in projects) {
      for (const hexathon in hexathons) {
        projects[project].hexathon = hexathons[hexathon];
      }
    }

    res.status(200).json(projects);
  })
);

projectRoutes.route("/special/category-group/:id").get(
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: {
        categoryGroups: {
          some: {
            id: parseInt(req.params.id),
          },
        },
      },
    });

    const categoriesIds = categories.map(category => category.id);

    if (categoriesIds.length === 0) {
      res.status(200).json([]);
      return;
    }

    const projects = await prisma.project.findMany({
      where: {
        categories: {
          some: {
            id: {
              in: categoriesIds,
            },
          },
        },
      },
      include: {
        members: true,
        categories: true,
        ballots: {
          select: {
            score: true,
            user: true,
            criteria: true,
          },
        },
      },
    });

    res.status(200).json(projects);
  })
);
