import express = require("express");

import { EventModel } from "src/models/event";

export const eventRoutes = express.Router();

// displays current eventTypes and their values
eventRoutes.route("").get(async (req, res) => {
  const events = await EventModel.find({}); //  Note: these are the event TYPES and their respective point values, not actual hackGT events
  if (!events) {
    // (eg. (mini-event: 40 points), (networking: 20 points) )
    res.status(400).send({ error: true, message: `Could not find event types' ` });
  }
  res.send(events);
});

eventRoutes.route("/add/:eventType/:points").post(async (req, res) => {
  const { eventType } = req.params;
  const points = Number(req.params.points);
  if (!eventType) {
    res.sendStatus(400).send({ error: true, message: "Event type name could not be parsed" });
  } else if (!points || Number.isNaN(points)) {
    res.sendStatus(400).send({ error: true, message: "Event type points could not be parsed" });
  }

  const newEventType = new EventModel({
    eventType,
    points,
  });

  try {
    newEventType.id = newEventType._id.toString();
    await newEventType.save();
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send({ error: true, message: "Event type could not be made." });
  }
});

eventRoutes.route("/edit/:eventType").put(async (req, res) => {
  // TODO: should I query by eventName or the mongo id? the name could have spaces in it
  const selectedType = req.params.eventType;
  const event = await EventModel.findOne({ eventType: selectedType });
  if (!event) {
    res
      .status(400)
      .send({ error: true, message: `Could not find event type with name: '${selectedType}' ` });
  }

  let fieldChanged = false;
  if (req.body.updatedTypeName) {
    // if you want to change the event's name or point value (both optional)
    const newTypeName = req.body.updatedTypeName;
    await EventModel.updateOne({ eventType: selectedType }, { $set: { eventType: newTypeName } });
    fieldChanged = true;
  }
  if (req.body.updatedTypePrice) {
    const newTypePrice = req.body.updatedTypePrice;
    await EventModel.updateOne({ eventType: selectedType }, { $set: { points: newTypePrice } });
    fieldChanged = true;
  }

  if (!fieldChanged) {
    res.sendStatus(400).send({
      error: true,
      message:
        "Must change either " +
        "eventType name or eventType point value. Maybe you mistyped the body of the query",
    });
  }
  res.sendStatus(200);
});

eventRoutes.route("/remove/:eventType").delete(async (req, res) => {
  const { eventType } = req.params;
  const eventTypeObject = EventModel.findOne({ eventType });

  if (!eventType || !eventTypeObject) {
    res
      .sendStatus(400)
      .send({ error: true, message: "The event entered was not valid and could not be found" });
  }

  await EventModel.deleteOne({ eventType })
    .then(() => res.sendStatus(200))
    .catch(error =>
      res
        .status(400)
        .send({ error: true, message: `The event could not be deleted.${error.toString()}` })
    );
});

eventRoutes.route("/devAdd").get(async (req, res) => {
  const newEventArray = [
    { eventType: "food", points: 0 },
    { eventType: "workshop", points: 20 },
    { eventType: "ceremony", points: 10 },
    { eventType: "tech-talk", points: 20 },
    { eventType: "mini-event", points: 10 },
    { eventType: "important", points: 0 },
    { eventType: "speaker", points: 20 },
    { eventType: "mini-challenge", points: 10 },
    { eventType: "insight", points: 5 },
    { eventType: "discord", points: 5 },
  ];

  EventModel.create(newEventArray);
  const events = await EventModel.find({});
  if (!events) {
    res.sendStatus(400).send({ error: true, message: "The events could not be found" });
  } else {
    res.send(events);
  }
});
