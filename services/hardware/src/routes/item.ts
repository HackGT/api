import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";

import { Category, Item, Location } from "@api/prisma-hardware/generated";
import { QuantityController } from "../util/QuantityController";
import { prisma } from "../common";
import { populateItem } from "../util/util";

export const itemRouter = express.Router();

itemRouter.route("/").get(
  checkAbility("read", "Item"),
  asyncHandler(async (req, res) => {
    const items = await prisma.item.findMany({
      where: {
        hidden: req.user?.roles.admin ? undefined : false,
      },
      include: {
        location: true,
        category: true,
      },
    });

    const locations = await prisma.location.findMany({
      where: {
        hidden: req.user?.roles.admin ? undefined : false,
      },
    });

    const itemQuantities = await QuantityController.all();
    const itemsByLocation: {
      location: Location;
      categories: { category: Category; items: Item[] }[];
    }[] = [];

    for (const location of locations) {
      const itemsAtLocation = items.filter(predItem => predItem.locationId === location.id);
      const itemsByCategory: Record<number, { category: Category; items: Item[] }> = {};

      for (const item of itemsAtLocation) {
        if (!Object.prototype.hasOwnProperty.call(itemsByCategory, item.categoryId)) {
          itemsByCategory[item.categoryId] = {
            category: item.category,
            items: [],
          };
        }

        // @ts-ignore
        itemsByCategory[item.categoryId].items.push(
          populateItem(item, req.user?.roles, itemQuantities)
        );
      }

      itemsByLocation.push({
        location,
        categories: Object.values(itemsByCategory).sort((a, b) =>
          a.category.name.localeCompare(b.category.name)
        ),
      });
    }

    res.status(200).send(itemsByLocation);
  })
);

itemRouter.route("/:id").get(
  checkAbility("read", "Item"),
  asyncHandler(async (req, res) => {
    const item = await prisma.item.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.status(200).send(item);
  })
);

itemRouter.route("/statistics").get(
  checkAbility("manage", "Item"),
  asyncHandler(async (req, res) => {
    const prismaItems = await prisma.item.findMany({
      include: {
        category: true,
        location: true,
      },
    });

    const itemQuantities = await QuantityController.all();
    const items = prismaItems.map(item => populateItem(item, req.user?.roles, itemQuantities));
    const detailedQuantities = await QuantityController.getQuantities();

    const statistics = items.map(item => {
      const qtyInfo = detailedQuantities[item.id] || {
        SUBMITTED: 0,
        APPROVED: 0,
        DENIED: 0,
        ABANDONED: 0,
        CANCELLED: 0,
        READY_FOR_PICKUP: 0,
        FULFILLED: 0,
        RETURNED: 0,
        LOST: 0,
        DAMAGED: 0,
        total: 0,
      };
      return {
        item,
        detailedQuantities: qtyInfo,
      };
    });

    res.status(200).send(statistics);
  })
);
// itemRouter.route("/amount/:id").get(
//   checkAbility("read", "Item"),
//   asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const item = await ItemModel.findById(id);

//     return res.send(item ? item.totalAvailable : item);
//   })
// );

itemRouter.route("/").post(
  checkAbility("create", "Item"),
  asyncHandler(async (req, res) => {
    if (!req.body.name.trim().length) {
      throw new BadRequestError("The item name can't be empty.");
    }
    if (!req.body.category.trim().length) {
      throw new BadRequestError("The category for this item can't be blank.");
    }
    if (!req.body.location.trim().length) {
      throw new BadRequestError("The location for this item can't be blank.");
    }
    const category = parseInt(req.body.category);
    const location = parseInt(req.body.location);
    const description = req.body.description.trim();
    const price = parseFloat(req.body.price);
    const totalAvailable = parseInt(req.body.totalAvailable);
    const maxRequestQty = parseInt(req.body.maxRequestQty);

    if (totalAvailable < 0) {
      throw new BadRequestError(
        `The total quantity available (totalQtyAvailable) for a new item can't be less than 0.  Value provided: ${req.body.totalAvailable}`
      );
    }
    if (maxRequestQty < 1) {
      throw new BadRequestError(
        `The max request quantity (maxRequestQty) must be at least 1.  Value provided: ${req.body.maxRequestQty}`
      );
    }
    if (maxRequestQty > totalAvailable) {
      throw new BadRequestError(
        `The max request quantity (maxRequestQty) can't be greater than the total quantity of this item (totalAvailable) that is available.  maxRequestQty: ${req.body.maxRequestQty}, totalAvailable: ${req.body.totalAvailable}`
      );
    }

    const item = await prisma.item.create({
      data: {
        ...req.body,
        price,
        description,
        totalAvailable,
        maxRequestQty,
        category: {
          connect: {
            id: category,
          },
        },
        location: {
          connect: {
            id: location,
          },
        },
      },
      include: {
        category: true,
        location: true,
      },
    });

    const itemQuantities = await QuantityController.all([item.id]);
    const populatedItem = populateItem(item, req.user?.roles, itemQuantities);

    res.status(200).send(populatedItem);
  })
);

itemRouter.route("/:id").put(
  checkAbility("update", "Item"),
  asyncHandler(async (req, res) => {
    if (!req.params.id || parseInt(req.params.id) <= 0) {
      throw new BadRequestError(
        "You must provide a valid item ID (greater than or equal to 0) to update an item."
      );
    }
    if (!req.body.name.trim().length) {
      throw new BadRequestError("The item name can't be empty.");
    }
    if (!req.body.category.name.trim().length) {
      throw new BadRequestError("The category for this item can't be blank.");
    }
    if (!req.body.location.name.trim().length) {
      throw new BadRequestError("The location for this item can't be blank.");
    }
    if (req.body.totalAvailable < 0) {
      throw new BadRequestError(
        `The total quantity available (totalQtyAvailable) for a new item can't be less than 0.  Value provided: ${req.body.totalAvailable}`
      );
    }
    if (req.body.maxRequestQty < 1) {
      throw new BadRequestError(
        `The max request quantity (maxRequestQty) must be at least 1.  Value provided: ${req.body.maxRequestQty}`
      );
    }
    if (req.body.maxRequestQty > req.body.totalAvailable) {
      throw new BadRequestError(
        `The max request quantity (maxRequestQty) can't be greater than the total quantity of this item (totalAvailable) that is available.  maxRequestQty: ${req.body.maxRequestQty}, totalAvailable: ${req.body.totalAvailable}`
      );
    }

    const item = await prisma.item.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        ...req.body,
        category: {
          connect: {
            id: req.body.category.id,
          },
        },
        location: {
          connect: {
            id: req.body.location.id,
          },
        },
      },
      include: {
        category: true,
        location: true,
      },
    });

    const itemQuantities = await QuantityController.all([item.id]);
    const populatedItem = populateItem(item, req.user?.roles, itemQuantities);

    res.status(200).send(populatedItem);
  })
);
