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

  if (req.user.roles.member) {
    can("manage", "Interaction");
    can("aggregate", "Interaction");
    can("manage", "Event");
    can("manage", "Location");
    can("manage", "Tag");
    can("manage", "Checkin");
    can("aggregate", "SwagItem");
    can("manage", "HexathonUser");
    can("manage", "Block");
    can("manage", "FoodBatch");
  }

  if (req.user.roles.admin || req.user.roles.exec) {
    can("manage", "Hexathon");
    can("manage", "SwagItem");
  }

  if (req.user.roles.admin || req.user.roles.member) {
    can("manage", "Team");
  }

  can("read", "Hexathon");
  can("read", "Interaction", { userId: req.user.uid });
  can("create", "Interaction");
  can("read", "Event");
  can("read", "Location");
  can("read", "Tag");
  can("read", "Checkin", { userId: req.user.uid });
  can("read", "HexathonUser");
  can("manage", "HexathonUser", { userId: req.user.uid });
  can("read", "Team");
  can("manage", "Team", { members: req.user.uid });
  can("read", "SwagItem");
  can("read", "Visit");
  can("manage", "Visit");
  can("read", "SponsorVisit");
  can("read", "Block");
  can("read", "FoodBatch");

  req.ability = build();
  next();
};
