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
    can("manage", "Hexathon");
  }

  if (req.user.roles.admin || req.user.roles.member) {
    can("manage", "Interaction");
    can("aggregate", "Interaction");
    can("manage", "Event");
    can("manage", "Location");
    can("manage", "Tag");
    can("manage", "Checkin");
    can("aggregate", "PrizeItem");
    can("manage", "HexathonUser");
  }

  if (req.user.roles.admin || req.user.roles.exec) {
    can("manage", "PrizeItem");
  }

  can("read", "Hexathon", { isActive: true });
  can("read", "Interaction", { userId: req.user.uid });
  can("read", "Event");
  can("read", "Location");
  can("read", "Tag");
  can("read", "Checkin", { userId: req.user.uid });
  can("read", "HexathonUser", { userId: req.user.uid });
  can("read", "PrizeItem");
  can("read", "Visit");
  can("manage", "Visit");
  can("read", "SponsorVisit");

  req.ability = build();
  next();
};
