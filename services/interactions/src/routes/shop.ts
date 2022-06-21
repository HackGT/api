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
  res.status(200).send("Item added to shop.");
});

shopRoutes.route("/item/:itemName").put(async (req, res) => {
  const { itemName } = req.params;
  const item = await ItemModel.findOne({ name: itemName });

  const updatedItemName = req.body.newName;
  const updatedItemDesc = req.body.newDescription;
  const updatedItemShop_id = req.body.newShop_id;
  const updatedItemCapacity = req.body.newCapacity;
  const updatedItemPoints = req.body.newPoints;
  const updatedItemStatus = req.body.newStatus;
  const updatedItemShippable = req.body.newShippable;
  const updatedItemNumRequested = req.body.newNumRequested;
  const updatedItemImage_url = req.body.newImage_url;
  if (!req.user) {
    res.status(400).send({ error: true, message: "User does not exist" });
  } else if (!item) {
    res.status(400).send({
      error: true,
      message: `Could not find item type with name: '${itemName}' `,
    });
  }

  try {
    await ItemModel.updateOne(
      { name: itemName },
      {
        $set: {
          name: updatedItemName,
          description: updatedItemDesc,
          shop_id: updatedItemShop_id,
          // number is deprecated
          capacity: updatedItemCapacity,
          points: updatedItemPoints,
          status: updatedItemStatus,
          shippable: updatedItemShippable,
          totalNumRequested: updatedItemNumRequested,
          image_url: updatedItemImage_url,
        },
      }
    );
  } catch (err) {
    throw new BadRequestError("Could not update item.");
  }

  res.status(201).send("Item updated successfully.");
});

shopRoutes.route("/item/:itemId").delete(async (req, res) => {
  const { itemId } = req.params;
  const item = await ItemModel.findOne({ id: itemId });

  if (item) {
    const shopId = item.shop_id;
    await ShopModel.update({ shop_id: shopId }, { $pull: { items: itemId } });
  } else {
    res.status(400).send({ error: true, message: "Item does not exist." });
  }

  await ItemModel.deleteOne({ id: itemId })
    .then(() => res.sendStatus(200))
    .catch(error => res.status(400).send({ error: true, message: "Item could not be deleted." }));
});

shopRoutes.route("/").get(async (req, res) => {
  const shops = await ShopModel.find({});
  res.send(shops);
});

shopRoutes.route("/get-shop/:shopId").get(async (req, res) => {
  const { shopId } = req.params;
  const shop = await ShopModel.find({ shop_id: shopId });
  // error handling, lmao
  res.send(shop);
});

shopRoutes.route("/create-shop/:shopId").post(async (req, res) => {
  const { owner } = req.params; // probably change this to the user's uuid
  const { shopId } = req.params;

  const new_shop = new ShopModel({ shop_id: shopId, owner, items: [] });
  if (!owner) {
    res.status(400).send({ error: true, message: "Owner does not exist." });
  }
  if (!shopId) {
    res.status(400).send({ error: true, message: "ShopID does not exist." });
  }

  await new_shop.save(err => {
    if (err) {
      console.log(err);
      res.status(400).send({ error: true, message: "Shop could not be made." });
    }
    res.sendStatus(200);
  });
});
