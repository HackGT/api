import express from "express";
import { asyncHandler } from "@api/common";

import { prisma } from "../common";
import { isAdmin } from "../utils/utils";

export const winnerRoutes = express.Router();

// Get all winners
winnerRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const winners = await prisma.winner.findMany({
      where: {
        hexathon: String(req.query.hexathon),
      },
      include: {
        project: {
          include: {
            members: true,
          },
        },
        category: true,
      },
    });
    res.status(200).json(winners);
  })
);

winnerRoutes.route("/export").get(
  isAdmin,
  asyncHandler(async (req, res) => {
    const winners = await prisma.winner.findMany({
      select: {
        rank: true,
        project: {
          select: {
            name: true,
            devpostUrl: true,
            members: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    let combinedWinners =
      "Project Name, Category Name, Rank, Devpost Link, Participant 1 name, Participant 1 email, Participant 2 name, Participant 2 email, Participant 3 name, Participant 3 email, Participant 4 name, Participant 4 email\n";

    winners.forEach(element => {
      combinedWinners += `${element.project.name},`;
      combinedWinners += `${element.category.name},`;
      combinedWinners += `${element.rank},`;
      combinedWinners += `${element.project.devpostUrl},`;
      element.project.members.forEach(member => {
        combinedWinners += `${member.name},`;
        combinedWinners += `${member.email},`;
      });
      combinedWinners += "\n";
    });
    res.header("Content-Type", "text/csv");
    res.status(200).send(combinedWinners);
  })
);

// Get winner by id
winnerRoutes.route("/:id").get(
  isAdmin,
  asyncHandler(async (req, res) => {
    const winnerId: number = parseInt(req.params.id);
    const winner = await prisma.winner.findUnique({
      where: {
        id: winnerId,
      },
    });
    res.status(200).json(winner);
  })
);

// Get winners by Category id
winnerRoutes.route("/category/:id").get(
  isAdmin,
  asyncHandler(async (req, res) => {
    const categoryId: number = parseInt(req.params.id);
    const categoryWinners = await prisma.winner.findMany({
      where: {
        categoryId,
      },
    });
    res.status(200).json(categoryWinners);
  })
);

winnerRoutes.route("/winnerCards").get(
  isAdmin,
  asyncHandler(async (req, res) => {
    const winners = await prisma.winner.findMany({});
    res.status(200).json(winners);
  })
);

// add new winner
winnerRoutes.route("/").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const createdWinner = await prisma.winner.create({
      data: req.body.data,
    });
    res.status(201).json(createdWinner);
  })
);

// edit existing winner
winnerRoutes.route("/:id").patch(
  isAdmin,
  asyncHandler(async (req, res) => {
    const updatedWinner = await prisma.winner.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: req.body,
    });

    res.status(200).json(updatedWinner);
  })
);

// delete existing winner
winnerRoutes.route("/:id").delete(
  isAdmin,
  asyncHandler(async (req, res) => {
    await prisma.winner.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.status(204).end();
  })
);
