import { asyncHandler, BadRequestError, checkAbility, ForbiddenError } from "@api/common";
import express from "express";

import { RequestStatus, User } from "@api/prisma-hardware/generated";
import { QuantityController } from "../util/QuantityController";
import { prisma } from "../common";
import { getItem, getSettings, populateItem } from "../util/util";

export const hardwareRequestRouter = express.Router();

hardwareRequestRouter.route("/").get(
  checkAbility("read", "HardwareRequest"),
  asyncHandler(async (req, res) => {
    const searchObj: any = {};

    let statuses: RequestStatus[] = [
      "SUBMITTED",
      "APPROVED",
      "DENIED",
      "ABANDONED",
      "CANCELLED",
      "READY_FOR_PICKUP",
      "FULFILLED",
      "RETURNED",
      "LOST",
      "DAMAGED",
    ];
    if (req.query.statuses && req.query.statuses.length) {
      statuses = String(req.query.statuses).split(",") as RequestStatus[];
    }

    if (req.query.userId) {
      searchObj.userId = req.query.userId;
    }

    // If user is not an admin
    if (!req.user?.roles.admin) {
      // then if they are requesting requests for a user that is not themselves
      if (req.query.userId && req.query.userId !== req.user?.uid) {
        res.send([]); // return an empty array and avoid making a DB query
        return;
      }

      searchObj.userId = req.user?.uid; // otherwise, restrict their results to just their user ID
      searchObj.item = {
        location: {
          hidden: false, // don't show hidden locations
        },
        hidden: false, // don't show hidden items
      };
    }

    const requests = await prisma.request.findMany({
      where: {
        status: {
          in: statuses.length === 0 ? undefined : statuses,
        },
        ...searchObj,
      },
      include: {
        user: true,
        item: {
          include: {
            category: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const items: number[] = [];

    requests.forEach(value => {
      if (items.indexOf(value.itemId) === -1) {
        items.push(value.itemId);
      }
    });

    const itemQuantities = await QuantityController.all(items);

    const filledRequests = requests.map(request => ({
      ...request,
      item: populateItem(request.item, req.user?.roles, itemQuantities),
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));

    res.send(filledRequests);
  })
);

hardwareRequestRouter.route("/").post(
  checkAbility("create", "HardwareRequest"),
  asyncHandler(async (req, res) => {
    // if non-admin, user on request must be user signed in
    if (!req.user?.roles.admin && req.user?.uid !== req.body.user) {
      throw new BadRequestError(
        "Unable to create request because you are not an admin and your UUID does not match the UUID of the user this request is for"
      );
    }

    const settings = await getSettings();
    if (!settings.isHardwareRequestsAllowed) {
      throw new BadRequestError("Requests are disabled at this time");
    }

    // fetch the item
    const item = await getItem(req, req.body.itemId);
    if (!item) {
      throw new BadRequestError(
        `Can't create request for item that doesn't exist! Item ID provided: ${req.body.itemId}`
      );
    }

    // clip item quantity to allowed values
    if (req.body.quantity > item.maxRequestQty) {
      console.log(
        "clipping request quantity (too high), original:",
        req.body.quantity,
        ", new:",
        item.maxRequestQty
      );
      req.body.quantity = item.maxRequestQty;
    } else if (req.body.quantity < 1) {
      console.log("clipping request quantity (too low), original:", req.body.quantity, ", new:", 1);
      req.body.quantity = 1;
    }

    const initialStatus: RequestStatus = "SUBMITTED";

    const user = await prisma.user.upsert({
      where: {
        userId: req.body.user,
      },
      update: {
        name: req.body.name,
      },
      create: {
        userId: req.body.user,
        name: req.body.name,
      },
    });

    if (!user) {
      throw new BadRequestError("Unable to find/create user");
    }

    const newRequest = await prisma.request.create({
      data: {
        quantity: req.body.quantity,
        status: initialStatus,
        item: {
          connect: {
            id: req.body.itemId,
          },
        },
        user: {
          connect: {
            userId: req.body.user,
          },
        },
      },
      include: {
        user: true,
        item: true,
      },
    });

    const updatedItem = await getItem(req, req.body.itemId);
    if (!updatedItem) {
      throw new BadRequestError(
        "Unable to retrieve the new item information after creating request"
      );
    }

    // const simpleRequest = toSimpleRequest(newRequest);
    // const result: Request = {
    //   ...simpleRequest,
    //   user,
    //   item: updatedItem,
    // };
    // pubsub.publish(REQUEST_CHANGE, {
    //   [REQUEST_CHANGE]: result,
    // });

    res.status(200).send({
      id: newRequest.id,
      quantity: req.body.quantity,
      status: initialStatus,
      item: updatedItem,
      location: updatedItem.location,
      createdAt: newRequest.createdAt,
      updatedAt: newRequest.updatedAt,
    });
  })
);

hardwareRequestRouter.route("/:id").put(
  checkAbility("update", "HardwareRequest"),
  asyncHandler(async (req, res) => {
    const updateObj: any = {};

    // Not going to validate against maxRequestQty since only admins can change this currently

    const { quantity } = req.body;
    if (quantity && quantity <= 0) {
      throw new BadRequestError(
        `Invalid new requested quantity of ${quantity} specified.  The new requested quantity must be >= 1.`
      );
    }

    // TODO: status change validation logic
    if (req.body.status) {
      updateObj.status = req.body.status;
    }

    if (req.body.quantity) {
      updateObj.quantity = req.body.quantity;
    }

    let updatedUserHaveID = null;
    if (typeof req.body.userHaveId !== "undefined") {
      updatedUserHaveID = req.body.userHaveId;
    }

    if (Object.keys(updateObj).length >= 1) {
      updateObj.updatedAt = new Date();

      const updatedRequest = await prisma.request.update({
        where: {
          id: parseInt(req.params.id),
        },
        data: updateObj,
      });

      // const simpleRequest = toSimpleRequest(updatedRequest);

      let user: User | null;
      if (updatedUserHaveID !== null) {
        user = await prisma.user.update({
          where: {
            userId: updatedRequest.userId,
          },
          data: {
            haveID: updatedUserHaveID,
          },
        });
      } else {
        user = await prisma.user.findUnique({
          where: {
            userId: updatedRequest.userId,
          },
        });
      }

      if (!user) {
        throw new BadRequestError("Unknown user");
      }

      // fetch the item
      const item = await getItem(req, updatedRequest.itemId);

      if (!item) {
        throw new BadRequestError(
          `Can't create request for item that doesn't exist!  Item ID provided: ${updatedRequest.itemId}`
        );
      }

      if (updatedRequest === null) {
        res.status(200).send({});
      }

      const result = {
        // ...simpleRequest,
        user,
        item,
      };

      // pubsub.publish(REQUEST_CHANGE, {
      //   [REQUEST_CHANGE]: result,
      // });

      res.status(200).send(result);
    }

    res.status(200).send({});
  })
);

hardwareRequestRouter.route("/:id").delete(
  checkAbility("delete", "HardwareRequest"),
  asyncHandler(async (req, res) => {
    await prisma.request.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.sendStatus(204);
  })
);
