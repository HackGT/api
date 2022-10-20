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
  }

  if (req.user.roles.member) {
    can("manage", "Item");
  }

  if (req.user.roles.admin || req.user.roles.member) {
    can("manage", "Item");
    can("manage", "Category");
  }

  can("read", "Item");
  can("read", "Category");
  can("manage", "HardwareRequest");

  req.ability = build();
  next();
};
