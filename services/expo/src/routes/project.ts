/* eslint-disable guard-for-in */
import express from "express";
import { BadRequestError, apiCall, asyncHandler } from "@api/common";
import { Service } from "@api/config";

import { prisma } from "../common";
import {
  calculateMeanAndStandardDeviation,
  getConfig,
  getCurrentHexathon,
  isAdmin,
} from "../utils/utils";
import {
  validateTeam,
  validateDevpost,
  validatePrizes,
  getEligiblePrizes,
} from "../utils/validationHelpers";
import { Prisma, TableGroup } from "@api/prisma-expo/generated";

export const projectRoutes = express.Router();

projectRoutes.route("/").get(
  asyncHandler(async (req: any, res) => {
    const { expo, round, table, search, categories, hexathon } = req.query;

    const filter: Prisma.ProjectWhereInput = {};
    if (expo) filter.expo = parseInt(expo);
    if (round) filter.round = parseInt(round);
    if (table) filter.table = parseInt(table);
    if (hexathon) filter.hexathon = hexathon;
    if (search) {
      filter.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          members: {
            some: {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
      ];
    }
    if (categories) {
      filter.categories = {
        some: {
          id: {
            in: String(categories)
              .split(",")
              .map((category: any) => parseInt(category)),
          },
        },
      };
    }

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
        tableGroup: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    res.status(200).json(matches);
  })
);

projectRoutes.route("/submission/team-validation").post(
  asyncHandler(async (req, res) => {
    const resp = await validateTeam(req.body.members, req);
    if (resp.error) {
      res.status(400).json(resp);
    } else {
      res.status(200).json(resp);
    }
  })
);

// TODO: Fill in prize validation as needed
projectRoutes.route("/submission/prize-validation").post(
  asyncHandler(async (req, res) => {
    const resp = await validatePrizes(req.body.prizes, req);
    if (resp.error) {
      res.status(400).json(resp);
    } else {
      res.status(200).json(resp);
    }
  })
);

// TODO: Fill in detail validation as needed
projectRoutes.route("/submission/detail-validation").post(
  asyncHandler(async (req, res) => {
    res.status(200).send({ error: false });
  })
);

projectRoutes.route("/submission/devpost-validation").post(
  asyncHandler(async (req, res) => {
    const resp = await validateDevpost(req.body.devpostUrl, req.body.name);
    if (resp.error) {
      res.status(400).json(resp);
    } else {
      res.status(200).json(resp);
    }
  })
);

projectRoutes.route("/submission/get-eligible-prizes").get(
  asyncHandler(async (req, res) => {
    // TODO Fix this any error
    const resp = (await getEligiblePrizes([], req)) as any;
    if (resp.error) {
      res.status(400).json(resp);
    } else {
      res.status(200).json(resp);
    }
  })
);

// Last step of the form, all the data is passed in here and a submission should be created
projectRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const config = await getConfig();
    const currentHexathon = await getCurrentHexathon(req);

    if (!config.isProjectSubmissionOpen) {
      throw new Error("Sorry, submissions are currently closed");
    }
    if (!req.body.submission) {
      throw new Error("Invalid submission");
    }

    const data = req.body.submission;

    const teamValidation = await validateTeam(data.members, req);
    if (teamValidation.error) {
      res.status(400).send(teamValidation);
      return;
    }

    const devpostValidation = await validateDevpost(data.devpostUrl, data.name);
    if (devpostValidation.error) {
      res.status(400).send(devpostValidation);
      return;
    }

    const projectExpo = Math.floor(Math.random() * config.numberOfExpo + 1);

    const tableGroups = await prisma.tableGroup.findMany({
      where: {
        hexathon: currentHexathon.id,
      },
    });

    const projectsInCurrentExpo = await prisma.project.findMany({
      where: {
        hexathon: currentHexathon.id,
        expo: projectExpo,
      },
    });

    let firstFreeTableGroup: undefined | TableGroup;
    let totalCapacity = 0;
    const tableNumberSet = new Set();

    // select first non-empty tableGroup
    for (const tableGroup of tableGroups) {
      const projectsInCurrentExpoAndTableGroup = projectsInCurrentExpo.filter(
        project => project.tableGroupId === tableGroup.id
      );

      for (const project of projectsInCurrentExpoAndTableGroup) {
        tableNumberSet.add(project.table);
      }

      // check for first free table group to assign table number to
      const isFreeTableGroup = projectsInCurrentExpoAndTableGroup.length < tableGroup.tableCapacity;
      if (isFreeTableGroup && firstFreeTableGroup === undefined) {
        firstFreeTableGroup = tableGroup;
      }

      totalCapacity += tableGroup.tableCapacity;
    }

    // no free table could be found; all table groups' capacities are full
    if (!firstFreeTableGroup) {
      throw new BadRequestError(
        "Submission could not be saved due to issue with table groups - please contact help desk"
      );
    }

    // assigns table to first unused number
    let tableNumber;
    for (let i = 1; i <= totalCapacity; i++) {
      if (!tableNumberSet.has(i)) {
        tableNumber = i;
        break;
      }
    }

    if (!teamValidation.registrationUsers) {
      throw new BadRequestError(
        "There was an error contacting registration. Please contact help desk."
      );
    }

    // in loop call all projects with table group id
    // find first available table
    try {
      await prisma.project.create({
        data: {
          name: data.name,
          description: data.description,
          devpostUrl: data.devpostUrl,
          githubUrl: data.githubUrl || "",
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
            connect: { id: firstFreeTableGroup.id },
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
      throw new BadRequestError("Submission could not be saved - please contact help desk");
    }

    res.status(200).send({ error: false });
  })
);

projectRoutes.route("/:id").patch(
  isAdmin,
  asyncHandler(async (req, res) => {
    console.log("BODY");
    console.log(req.body);
    let members: any[] = [];
    let categories: any[] = [];
    let tableGroup;
    let newTableNumber = -1;

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

    const reassignTable = async () => {
      const currentHexathon = await getCurrentHexathon(req);

      const tableGroups = await prisma.tableGroup.findMany({
        where: {
          hexathon: currentHexathon.id,
        },
      });

      const projectsInCurrentExpo = await prisma.project.findMany({
        where: {
          hexathon: currentHexathon.id,
          expo,
        },
      });

      let firstFreeTableGroup: undefined | TableGroup;
      let totalCapacity = 0;
      const tableNumberSet = new Set();

      // select first non-empty tableGroup
      for (const tableGroup of tableGroups) {
        const projectsInCurrentExpoAndTableGroup = projectsInCurrentExpo.filter(
          project => project.tableGroupId === tableGroup.id
        );

        for (const project of projectsInCurrentExpoAndTableGroup) {
          tableNumberSet.add(project.table);
        }

        // check for first free table group to assign table number to
        const isFreeTableGroup =
          projectsInCurrentExpoAndTableGroup.length < tableGroup.tableCapacity;
        if (isFreeTableGroup && firstFreeTableGroup === undefined) {
          firstFreeTableGroup = tableGroup;
        }

        totalCapacity += tableGroup.tableCapacity;
      }

      // no free table could be found; all table groups' capacities are full
      if (!firstFreeTableGroup) {
        throw new BadRequestError(
          "Submission could not be saved due to issue with table groups - please contact help desk"
        );
      }

      tableGroup = firstFreeTableGroup.id;
      for (let i = 1; i <= totalCapacity; i++) {
        if (!tableNumberSet.has(i)) {
          newTableNumber = i;
          break;
        }
      }
      console.log("table reassigned to:", firstFreeTableGroup.name, newTableNumber);
    };

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
        await reassignTable();
        // res.status(200).send({
        //   error: true,
        //   message: "Error: Duplicate Table Number.",
        // });
        // return;
      }
    } else if (req.body.tableGroupId || req.body.expo) {
      await reassignTable();
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
        table: newTableNumber >= 0 ? newTableNumber : req.body.table,
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
        tableGroup: true,
      },
    });

    if (project) {
      const hexathon = await apiCall(
        Service.HEXATHONS,
        {
          url: `/hexathons/${project.hexathon}`,
          method: "GET",
        },
        req
      );
      project.hexathon = hexathon;
    }

    res.status(200).json(project);
  })
);

projectRoutes.route("/special/dashboard").get(
  asyncHandler(async (req, res) => {
    let projects = await prisma.project.findMany({
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
        tableGroup: true,
      },
    });

    const hexUrl = req.query?.hexathon ? `/hexathons/${req.query?.hexathon}` : `/hexathons`;
    const hexathons = await apiCall(
      Service.HEXATHONS,
      {
        url: hexUrl,
        method: "GET",
        params: { id: req.query?.hexathon },
      },
      req
    );

    // check for hexathon id filter
    if (req.query?.hexathon) {
      const filteredProjects = [];
      for (const project in projects) {
        if (projects[project].hexathon === hexathons.id) {
          filteredProjects.push(projects[project]);
        }
      }
      projects = filteredProjects;
    }
    for (const project in projects) {
      for (const hexathon in hexathons) {
        if (projects[project].hexathon === hexathons[hexathon].id) {
          projects[project].hexathon = hexathons[hexathon];
        }
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

projectRoutes.route("/special/calculate-normalized-scores").get(
  asyncHandler(async (req, res) => {
    const currentHexathon = await getCurrentHexathon(req);

    const categoryGroups = await prisma.categoryGroup.findMany({
      where: {
        hexathon: currentHexathon.id,
      },
      include: {
        users: {
          select: {
            id: true,
            ballots: {
              select: {
                score: true,
              },
            },
          },
        },
      },
    });

    const projects = await prisma.project.findMany({
      where: {
        hexathon: currentHexathon.id,
      },
      select: {
        id: true,
        ballots: {
          select: {
            score: true,
            user: true,
          },
        },
      },
    });

    const projectScores: Record<number, number> = {};
    const judgeStats: Record<number, any> = {}; // judge id -> [mean, std dev]

    for (const categoryGroup of categoryGroups) {
      const { users } = categoryGroup;
      for (const user of users) {
        const { ballots } = user;
        const scores = [];
        for (const ballot of ballots) {
          scores.push(ballot.score);
        }
        if (scores.length === 0) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const { mean, standardDeviation } = calculateMeanAndStandardDeviation(...scores);
        judgeStats[Number(user.id)] = [mean, standardDeviation];
      }
    }

    for (const project of projects) {
      const { ballots } = project;
      if (ballots.length === 0) {
        projectScores[Number(project.id)] = 0;
        // eslint-disable-next-line no-continue
        continue;
      }
      const scores = [];
      let normalizedScore;
      for (const ballot of ballots) {
        let mean, standardDeviation;
        if (Number(ballot.user.id) in judgeStats) {
          [mean, standardDeviation] = judgeStats[Number(ballot.user.id)];
          normalizedScore = (ballot.score - mean) / standardDeviation;
        } else {
          normalizedScore = 0;
        }
        normalizedScore *= standardDeviation;
        scores.push(normalizedScore);
      }
      const { mean: meanOfNormScores } = calculateMeanAndStandardDeviation(...scores);
      projectScores[Number(project.id)] = meanOfNormScores;
    }
    res.status(200).json(projectScores);
  })
);
