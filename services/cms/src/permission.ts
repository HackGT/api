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

  // General permissions for all hexlabs people
  // if (req.user.roles.admin || req.user.roles.member || req.roles.exec) {
  // }

  // Sensitive things only admins and exec can do
  // if (req.user.roles.admin || req.user.roles.exec) {
  // }

  // Very important things only for execc
  // if (req.user.roles.exec) {
  // }

  req.ability = build();
  next();
};
