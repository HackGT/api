import { AbilityAction } from "@api/common";
import { AbilityBuilder, Ability, Subject } from "@casl/ability";
import { RequestHandler } from "express";

export const addAbilities = (): RequestHandler => (req, res, next) => {
  const { can, build } = new AbilityBuilder<Ability<[AbilityAction, Subject]>>(Ability);
  if (!req.user) {
    req.ability = build();
    next();
    return;
  }

  if (req.user.roles.admin) {
    can("manage", "Location");
    can("manage", "Category");
  }

  if (req.user.roles.member) {
    can("manage", "Item");
    can("manage", "HardwareRequest");
    can("manage", "HardwareSetting");
  }

  can("read", "Item");
  can("read", "Category");
  can(["read", "create"], "HardwareRequest");
  can("delete", "HardwareRequest", { userId: req.user.uid });
  can("read", "HardwareSetting");

  req.ability = build();
  next();
};
