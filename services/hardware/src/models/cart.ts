import { model, Schema } from "mongoose";

import { Item, ItemModel } from "./item";

interface Cart {
  orderNumber: number;
  items: Item[];
  uid: string;
}

const CartSchema = new Schema<Cart>({
  orderNumber: {
    type: Number,
    required: true,
  },
  items: {
    type: [Schema.Types.ObjectId],
    ref: ItemModel,
    default: [],
  },
  uid: {
    type: String,
    unique: true,
  },
});

export const CartModel = model<Cart>("Cart", CartSchema);
