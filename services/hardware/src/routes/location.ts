import { asyncHandler, checkAbility } from "@api/common";
import express from "express";

import { prisma } from "../common";

export const locationRouter = express.Router();

locationRouter.route("/").get(
  checkAbility("read", "Location"),
  asyncHandler(async (req, res) => {
    const locations = await prisma.location.findMany();

    res.status(200).send([locations.map(location => location.name)]);
  })
);

locationRouter.route("/").post(
  checkAbility("create", "Location"),
  asyncHandler(async (req, res) => {
    const location = await prisma.location.create({
      data: {
        name: req.body.name,
      },
    });

    res.status(200).send(location);
  })
);

// locationRouter.route("/").put(
//   checkAbility("update", "Location"),
//   asyncHandler(async (req, res) => {
//     const updatedLocation = await LocationModel.updateOne({
//       data: {
//         name: req.body.name
//       },
//       where: {

//       }
//     }

//     const location = await LocationModel.find({ name });

//     if (location) {
//       res.send(location);
//     }
//     const newLocation = await LocationModel.create({ name });

//     res.send(newLocation);
//   })
// );
