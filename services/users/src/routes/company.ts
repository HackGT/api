import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { getAuth } from "firebase-admin/auth"; // eslint-disable-line import/no-unresolved
import { FilterQuery } from "mongoose";

import { Company, CompanyModel } from "../models/company";

export const companyRoutes = express.Router();

companyRoutes.route("/").post(
  checkAbility("create", "Company"),
  asyncHandler(async (req, res) => {
    const { name, description, defaultEmailDomains, hasResumeAccess, employees, hexathon } =
      req.body;

    if (!name) {
      throw new BadRequestError("Please enter the name field at the minimum");
    }

    const newCompany = await CompanyModel.create({
      name,
      description,
      hexathon,
      defaultEmailDomains,
      hasResumeAccess,
      employees,
    });

    return res.status(200).send(newCompany);
  })
);

companyRoutes.route("/").get(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Company> = {};

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }

    const companies = await CompanyModel.accessibleBy(req.ability).find(filter);
    return res.status(200).send(companies);
  })
);

companyRoutes.route("/:id").get(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id).accessibleBy(req.ability);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    return res.status(200).send(company);
  })
);

companyRoutes.route("/:id").put(
  checkAbility("update", "Company"),
  asyncHandler(async (req, res) => {
    const requestedCompany = await CompanyModel.findById(req.params.id);

    if (!requestedCompany) {
      throw new BadRequestError("Requested company not valid");
    }

    const userCompany = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    if (!requestedCompany || !userCompany || requestedCompany.name !== userCompany.name) {
      throw new BadRequestError("Current user not associated with requested company");
    }

    const update = await requestedCompany.update(req.body, { new: true });
    return res.status(200).send(update);
  })
);

companyRoutes.route("/:id").delete(
  checkAbility("delete", "Company"),
  asyncHandler(async (req, res) => {
    await CompanyModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);

// get company based on employee id provided
companyRoutes.route("/employees/:employeeId").get(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findOne({ employees: req.params.employeeId });

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    return res.status(200).send(company);
  })
);

// used for accepting employee join requests
companyRoutes.route("/:id/employees/accept-request").post(
  checkAbility("update", "Company"),
  asyncHandler(async (req, res) => {
    const requestedCompany = await CompanyModel.findById(req.params.id);

    const userCompany = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    if (!requestedCompany || !userCompany || requestedCompany.name !== userCompany.name) {
      throw new BadRequestError("Current user not associated with requested company");
    }

    const employeeId = req.body.employee;

    if (requestedCompany.employees.includes(employeeId)) {
      throw new BadRequestError("User already in company");
    }

    const updatedCompany = await requestedCompany.update({
      employees: [...requestedCompany.employees, employeeId],
      $pull: {
        pendingEmployees: employeeId,
      },
    });

    return res.status(200).send(updatedCompany);
  })
);

companyRoutes.route("/:id/employees/add").post(
  checkAbility("update", "Company"),
  asyncHandler(async (req, res) => {
    const requestedCompany = await CompanyModel.findById(req.params.id);

    const userCompany = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    if (!requestedCompany || !userCompany || requestedCompany.name !== userCompany.name) {
      throw new BadRequestError("Current user not associated with requested company");
    }

    const emails = req.body.employees.split(",");
    const uniqueEmployees: string[] = requestedCompany.employees;

    const handleEmployees = new Promise<void>((resolve, reject) => {
      emails.forEach(async (email: string, index: number, employees: string[]) => {
        const user = await getAuth().getUserByEmail(email);
        const employeeUid = user.uid;

        if (!uniqueEmployees.includes(employeeUid)) {
          uniqueEmployees.push(employeeUid);
        }
        if (index === employees.length - 1) resolve();
      });
    });

    handleEmployees.then(async () => {
      const updatedCompany = await requestedCompany.update({
        members: uniqueEmployees,
        $pull: {
          pendingEmployees: { $in: uniqueEmployees },
        },
      });

      return res.status(200).send(updatedCompany);
    });
  })
);

companyRoutes.route("/:id/employees/request").post(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id);

    if (!company || !req.user) {
      throw new BadRequestError("Company or user not found.");
    }

    if (company.pendingEmployees.includes(req.user.uid)) {
      throw new BadRequestError("User invalid or has already requested to join this company");
    }

    const updatedCompany = await CompanyModel.findByIdAndUpdate(
      req.params.id,
      {
        pendingEmployees: [...company.pendingEmployees, req.user?.uid],
      },
      { new: true }
    );

    return res.status(200).send(updatedCompany);
  })
);

companyRoutes.route("/:id/employees").delete(
  checkAbility("update", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id).accessibleBy(req.ability);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    await company.update({
      $pull: {
        pendingEmployees: req.body.userId,
        employees: req.body.userId,
      },
    });

    return res.status(204).send(company);
  })
);
