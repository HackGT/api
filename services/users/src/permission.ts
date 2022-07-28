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
    can("manage", "Profile");
  }

  if (req.user.roles.member) {
    can("read", "Profile");
  }

  if (req.user.roles.admin || req.user.roles.member) {
    can("manage", "Company");
  }

  can("manage", "Profile", { userId: req.user.uid });
  can("read", "Company");

  req.ability = build();
  next();
};
