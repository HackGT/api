import { RequestStatus } from "@api/prisma-hardware/generated";
import { prisma } from "../common";

export interface ItemStatusQuantities {
  [itemId: string]: Record<RequestStatus | "total", number>;
}

export interface ItemQtyAvailable {
  [itemId: string]: number;
}

export interface ItemAllQtys {
  [itemId: string]: {
    qtyInStock: number;
    qtyUnreserved: number;
    qtyAvailableForApproval: number;
  };
}

export class QuantityController {
  public static async all(itemIds: number[] = []): Promise<ItemAllQtys> {
    const quantities: ItemStatusQuantities = await QuantityController.getQuantities(
      ["SUBMITTED", "APPROVED", "READY_FOR_PICKUP", "FULFILLED", "LOST", "DAMAGED"],
      itemIds
    );
    const totalAvailable: ItemQtyAvailable = await this.getTotalAvailable(itemIds);

    const qtyInStock: ItemQtyAvailable = this.getTotalAvailableLessStatuses(
      quantities,
      totalAvailable,
      ["FULFILLED", "LOST", "DAMAGED"]
    );
    const qtyUnreserved: ItemQtyAvailable = this.getTotalAvailableLessStatuses(
      quantities,
      totalAvailable,
      ["SUBMITTED", "APPROVED", "READY_FOR_PICKUP", "FULFILLED", "LOST", "DAMAGED"]
    );
    const qtyAvailableForApproval: ItemQtyAvailable = this.getTotalAvailableLessStatuses(
      quantities,
      totalAvailable,
      ["APPROVED", "READY_FOR_PICKUP", "FULFILLED", "LOST", "DAMAGED"]
    );

    const itemQuantities: ItemAllQtys = {};

    Object.keys(totalAvailable).forEach(itemId => {
      itemQuantities[itemId] = {
        qtyInStock: qtyInStock[itemId],
        qtyUnreserved: qtyUnreserved[itemId],
        qtyAvailableForApproval: qtyAvailableForApproval[itemId],
      };
    });

    return itemQuantities;
  }

  public static async getQuantities(
    statuses: RequestStatus[] = [],
    itemIds: number[] = []
  ): Promise<ItemStatusQuantities> {
    let selectStatuses = statuses;
    if (selectStatuses.length === 0) {
      selectStatuses = [
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
    }

    const quantities = await prisma.request.groupBy({
      by: ["itemId", "status"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        itemId: "asc",
      },
      where: {
        status: {
          in: selectStatuses.length === 0 ? undefined : selectStatuses,
        },
        itemId: {
          in: itemIds.length === 0 ? undefined : itemIds,
        },
      },
    });

    const baseObj: any = {};
    for (let i = 0; i < selectStatuses.length; i++) {
      baseObj[selectStatuses[i]] = 0;
    }

    const result: any = {};
    for (let i = 0; i < quantities.length; i++) {
      const item = quantities[i];
      const requestItemId = item.itemId;

      if (!Object.prototype.hasOwnProperty.call(result, requestItemId.toString(10))) {
        result[requestItemId] = { ...baseObj }; // make a copy of baseObj
      }

      result[requestItemId][item.status] = item._sum.quantity;
      result[requestItemId].total =
        result[requestItemId][item.status] + (result[requestItemId].total || 0);
    }

    return result;
  }

  private static getTotalAvailableLessStatuses(
    quantities: ItemStatusQuantities,
    totalAvailable: ItemQtyAvailable,
    statuses: RequestStatus[] = []
  ): ItemQtyAvailable {
    const result: ItemQtyAvailable = {};

    for (const id in totalAvailable) {
      if (Object.prototype.hasOwnProperty.call(totalAvailable, id)) {
        if (Object.prototype.hasOwnProperty.call(quantities, id)) {
          const itemStatusCounts = quantities[id];
          let quantity = totalAvailable[id];
          for (let i = 0; i < statuses.length; i++) {
            quantity -= itemStatusCounts[statuses[i]];
          }
          result[id] = quantity;
        } else {
          // no requests for this item with statuses provided, so just return totalAvailable
          result[id] = totalAvailable[id];
        }
      }
    }

    return result;
  }

  private static async getTotalAvailable(itemIds: number[] = []) {
    const items = await prisma.item.findMany({
      where: {
        id: {
          in: itemIds.length === 0 ? undefined : itemIds,
        },
      },
    });
    const resultObj: ItemQtyAvailable = {};

    for (const item of items) {
      resultObj[item.id] = item.totalAvailable;
    }

    return resultObj;
  }
}
