import { Schema, model } from "mongoose";

interface Shop {
  shop_id: string;
  owner: string;
  items: string[];
}

const shopSchema = new Schema<Shop>({
  shop_id: { type: String, required: true },
  owner: { type: String, required: true },
  items: {
    type: [
      {
        type: String,
      },
    ],
    default: [],
  },
});

export const ShopModel = model<Shop>("Shop", shopSchema);
