import { BadRequestError } from "@api/common";
import express from "express";

import { ItemModel } from "src/models/item";
import { ShopModel } from "src/models/shop";

export const shopRoutes = express.Router();

shopRoutes.route("/:shopId").post(async (req, res) => {
  const owner = req.user;
  const { shopId } = req.params;

  const newShop = new ShopModel({ shop_id: shopId, owner: owner.uuid });

  if (!shopId) {
    throw new BadRequestError("ShopID does not exist.");
  }

  await newShop.save(err => {
    if (err) {
      throw new BadRequestError("Shop could not be created.");
    } else {
      res.status(200).send("Shop created.");
    }
  });
});

shopRoutes.route("/:shopId").delete(async (req, res) => {
  const { shopId } = req.params;
  const shop = await ShopModel.findOne({ shop_id: shopId });

  if (shop) {
    await ItemModel.deleteMany({ shop_id: shopId });

    await ShopModel.deleteMany({ shop_id: shopId });

    res.status(200).send("Shop deleted.");
  } else {
    res.status(400).send("Shop doesn't exist.");
  }
});

shopRoutes.route("/:shopId").get(async (req, res) => {
  const shop = await ShopModel.findOne({ shop_id: req.params.shopId });
  if (!shop) {
    throw new BadRequestError("Shop not found.");
  } else if (!shop.items) {
    throw new BadRequestError("No items to get.");
  } else {
    const items = await ItemModel.find({ _id: { $in: shop.items } });
    res.status(200).send(items);
  }
});

shopRoutes.route("/:shopId/item/:itemId").put(async (req, res) => {
  const { shopId, itemId } = req.params;

  const itemToAdd = await ItemModel.findById(itemId);

  const shop = await ShopModel.findById(shopId);

  if (shop) {
    if (itemToAdd) {
      await ShopModel.findByIdAndUpdate(itemToAdd.shop_id, { $pull: { items: itemId } });

      shop.items.push(itemToAdd.id);
      await shop.save();
      itemToAdd.shop_id = shopId;

      await ItemModel.findByIdAndUpdate(itemId, req.body);
      await itemToAdd.save();

      res.status(200).send("Item has been added.");
    } else {
      throw new BadRequestError("Item doesn't exist.");
    }
  } else {
    throw new BadRequestError("Shop doesn't exist.");
  }
});

shopRoutes.route("/:shopId/item").post(async (req, res) => {
  const { shopId } = req.params;
  const { shippable, price, description, name, number, capacity } = req.body;

  const shop = await ShopModel.findById(shopId);
  if (!shop) {
    throw new BadRequestError("Shop not found or doesn't exist.");
  }

  const new_item = new ItemModel({
    shop_id: shopId,
    name,
    points: price,
    shippable,
    description,
    number,
    capacity,
  });

  try {
    new_item.id = new_item._id.toString();
    await new_item.save();

    shop.items.push(new_item.id);
    await shop.save();
  } catch (err) {
    throw new BadRequestError("Item could not be made.");
  }
  return res.status(200).send("Item added to shop.");
});
