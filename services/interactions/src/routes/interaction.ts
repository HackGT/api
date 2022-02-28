import { asyncHandler } from "@api/common";
import EventEmitter from "events";
import express from "express";
import { EventInteraction } from "src/models/interaction";

export const interactionRoutes = express.Router();

interactionRoutes.route("/").get(asyncHandler(async (req, res) => {
  const interactions = await EventInteraction.find({});

  return res.send(interactions);
}));

const requestParams = ["uuid", "userid"];

interactionRoutes.route("/").post(asyncHandler(async (req, res) => {
  try {
    // validate request to make sure types are there
    for (const param of requestParams) {
      if (!req.body[param]) {
        console.log(`no ${param}`);
        return res.status(400).send(`no ${param}`);
      }
    }
    
    try {
      let interaction = await EventInteraction.findOneAndUpdate(
        {uuid: req.body.uuid, userid: req.body.userid},
        {
          $setOnInsert: EventInteraction.create({
            uuid: req.body.uuid,
            userid: req.body.userid,
            timeIn: (new Date()).toLocaleString(),
          }),
        },
        {upsert: true, runValidators: true},
      );

      if (!interaction) {
        throw "interaction not found";
      }

      // Interaction was just created
      if (interaction.timeIn && interaction.timeIn == (new Date()).toLocaleString()) {
        return res.status(200).send("success");
      }
      if (interaction.timeIn && interaction.timeIn != (new Date()).toLocaleString()) {
        return res.status(400).send("interaction already exists for user");
      }
      throw "interaction timeIn not found";
    } catch (err) {
      console.log(`Error when getting/inserting interaction: ${err}`);
      return res.status(400).send("Error when get/insert interaction");
    }

  } catch (err) {
    console.log((err as Error).message);
    return res.sendStatus(500);
  }
}));

interactionRoutes.route("/:uuid").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

interactionRoutes.route("/:uuid/:userid").put(
  asyncHandler(async (req, res) => {
    let interaction = await EventInteraction.findOneAndUpdate(
      {uuid: req.body.uuid, userid: req.body.userid},
      {
        $set: {
          uuid: req.params.uuid,
          userid: req.params.userid,
          timeIn: (new Date()).toLocaleString(),
        },
      },
      {runValidators: true},
    );

    if (!interaction) {
      return res.status(400).send("interaction does not exist")
    }

    if (!interaction.uuid || !interaction.userid || !interaction.timeIn) {
      return res.status(400).send("interaction is missing a parameter");
    }

    return res.status(200).send("success")
  })
);
