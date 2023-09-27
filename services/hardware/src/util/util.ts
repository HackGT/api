import { ConfigError, UserRoles } from "@api/common";

import { Item, Location, Category } from "@api/prisma-hardware/generated";
import { prisma } from "../common";
import { ItemAllQtys, QuantityController } from "./QuantityController";

export const getSettings = async () => {
  const settings = await prisma.setting.findFirst();

  if (!settings) {
    throw new ConfigError(
      "Settings does not exist. Please ensure your database is setup properly."
    );
  }

  return settings;
};

export function populateItem(
  item: Item & { location: Location; category: Category },
  roles: UserRoles | undefined,
  itemQuantities: ItemAllQtys
) {
  return {
    ...item,
    ...itemQuantities[item.id],
    ...(roles?.admin && { price: item.price }),
    // ...(roles?.admin && { owner: item.owner }),
  };
}

export async function getItem(req: Express.Request, itemId: number) {
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
    },
    include: {
      location: true,
      category: true,
    },
  });

  if (item === null) {
    return null;
  }

  const itemQuantities = await QuantityController.all([itemId]);
  return populateItem(item, req.user?.roles, itemQuantities);
}
