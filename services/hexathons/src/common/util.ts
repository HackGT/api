import { BadRequestError } from "@api/common";
import express from "express";

import { EventType } from "../models/event";
import { HexathonUserModel } from "../models/hexathonUser";
import { InteractionModel, InteractionType } from "../models/interaction";

const EVENT_TYPE_POINTS: { [key in EventType]: number } = {
  "food": 0,
  "workshop": 100,
  "ceremony": 25,
  "tech-talk": 125,
  "mini-event": 100,
  "important": 0,
  "speaker": 150,
  "mini-challenge": 125,
};

/** For each 'event' a user attends, if the user is `inperson`, they get full points. If `virtual`, it scales so that if
 * they attend half of the event, they get all of the points.
 * `discord` and `insight` (sponsor fair) give the user all of the points if they attend just once, instead of scaling
 * like other virtual events.
 */
export const getHexathonUserWithUpdatedPoints = async (
  req: express.Request,
  userId: string,
  hexathon: string
) => {
  const hexathonUser = await HexathonUserModel.accessibleBy(req.ability).findOne({
    userId,
    hexathon,
  });
  if (!hexathonUser) {
    throw new BadRequestError("You do not have access or invalid params provided.");
  }

  // Load user events
  const interactions = await InteractionModel.accessibleBy(req.ability)
    .find({
      userId,
      hexathon,
    })
    .populate("event");

  // Calculate points
  const points = interactions.reduce((prev, interaction) => {
    // Check that interaction type is event and eventType is defined
    if (
      interaction.type === InteractionType.EVENT &&
      interaction.event?.type &&
      Object.values(EventType).includes(interaction.event.type)
    ) {
      return prev + EVENT_TYPE_POINTS[interaction.event.type];
    }
    if (interaction.type === InteractionType.SCAVENGER_HUNT) {
      // Future consideration: event types unique to order of scavenger hunt
      return prev + 50;
    }
    if (interaction.type === InteractionType.EXPO_SUBMISSION) {
      return prev + 250;
    }
    return prev;
  }, 0);

  // Refresh user points
  const updatedHexathonUser = await HexathonUserModel.findOneAndUpdate(
    {
      userId,
      hexathon,
    },
    {
      "points.numCollected": points,
      "points.updatedAt": new Date(),
    },
    {
      new: true,
    }
  );

  if (!updatedHexathonUser) {
    throw new BadRequestError("There was an error updating the user points.");
  }

  return updatedHexathonUser;
};

/** OLD CODE FROM PRIZES USED FOR VIRTUAL EVENT */

// const bufferDict: { [date: string]: number } = {};
// for (const eventAttended of userEvents) {
//   if (!Object.keys(pointMapping).includes(eventAttended.eventType!)) {
//     continue;
//   }
//   const maxPoints = pointMapping[eventAttended.eventType!];
//   let pointBuffer = 0;
//   if (
//     eventAttended.eventType == EventType.Discord ||
//     eventAttended.eventType == EventType.Insight ||
//     eventAttended.eventType == EventType.ScavengerHunt ||
//     eventAttended.eventType == EventType.SubmissionExpo
//   ) {
//     pointBuffer = maxPoints;
//   } else {
//     if (!eventAttended.eventStartTime || !eventAttended.eventTotalDuration) {
//       const event = await getCMSEvent(eventAttended.eventID);
//       if (!event) {
//         return {
//           success: false,
//           message: "Not a CMS event/ event id incorrect",
//           userEvents,
//         };
//       }
//       const event2: ICMSEvent = event;
//       if (!eventAttended.eventStartTime) {
//         eventAttended.eventStartTime = event2.startDate;
//       }
//       if (!eventAttended.eventTotalDuration) {
//         const startTime = moment(event2.startDate).tz("America/New_York");
//         const endTime = moment(event2.endDate).tz("America/New_York");
//         const totalduration = endTime.diff(startTime, "seconds");
//         eventAttended.eventTotalDuration = totalduration;
//       }
//     }

//     /** User automatically gets full points if they are either `in person`, or attending `discord` or `insight` events. */
//     let userGetsFullPoints = false;
//     for (const instance of eventAttended.instances!) {
//       if (instance.interactionType == InteractionType.Inperson) {
//         userGetsFullPoints = true;
//         break;
//       }
//     }

//     if (userGetsFullPoints) {
//       pointBuffer += maxPoints; // give all of the points for the event

//       console.log(
//         `\nEvent "${eventAttended.eventName}" of type: "${eventAttended.eventType}", points per event: ${maxPoints}\n` +
//           `Percent of event attended: [inperson/insight/discord].\n` +
//           `Total event time (s): ALL out of ${eventAttended.eventTotalDuration}`
//       );
//     } else if (
//       (eventAttended.virtualDuration || eventAttended.virtualDuration == 0) &&
//       (eventAttended.eventTotalDuration || eventAttended.eventTotalDuration == 0)
//     ) {
//       const percentAttended =
//         eventAttended.virtualDuration! / eventAttended.eventTotalDuration!;

//       // if the participant attended more than 50% of the event, they get full points (capped, ofc)
//       pointBuffer = Math.max(percentAttended * 2 * maxPoints, 0);
//       pointBuffer = Math.min(pointBuffer, maxPoints);

//       console.log(
//         `\nEvent "${eventAttended.eventName}" of type: "${eventAttended.eventType}, points per event: ${maxPoints}\n` +
//           `Percent of event attended: %${percentAttended * 100}.\n` +
//           `Total event time (s): ${eventAttended.virtualDuration} out of ${eventAttended.eventTotalDuration} for ${pointBuffer} points`
//       );
//     } else {
//       return {
//         success: false,
//         message:
//           "Non-CMS Event types not named correctly. Please Contact Virtual-Checkin Team or Prizes Team if reached here.",
//         userEvents,
//       };
//       // If this code is reached,
//       // the event has not yet been initialized (even though it should be), this could be caused by a logic error.
//     }
//   }

//   const evStart = eventAttended.eventStartTime!;

//   if (evStart in bufferDict) {
//     // if there's already an entry, choose the one that gives the user the most points
//     bufferDict[evStart] = Math.max(pointBuffer, bufferDict[evStart]);
//   } else {
//     bufferDict[evStart] = pointBuffer;
//   }
// }

// // console.log("Final events to be added: " + JSON.stringify(bufferDict));

// // final point calculation
// let pointSum = 0;
// for (const key in bufferDict) {
//   pointSum += bufferDict[key];
// }

// const userData = await User.findById(user._id);
// if (!userData) {
//   return { success: false, message: "Could not get points used", code: 400 };
// }

// pointSum -= userData.pointsUsed;
// if (userData.additionalPoints) {
//   pointSum += userData.additionalPoints;
// }

// pointSum += 25;

// if (userData.branch.includes("Virtual")) {
//   pointSum += 20;
// }

// if (Number.isNaN(pointSum)) {
//   return {
//     success: false,
//     message: "At least one of the user's events does not have a correct event type",
//     code: 400,
//   };
// }
// return { success: true: pointSum, code: 200 };
