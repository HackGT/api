import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";
import { getAuth } from "firebase-admin/auth"; // eslint-disable-line import/no-unresolved

import { CompanyModel } from "../models/company";

export const companyRoutes = express.Router();

companyRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const { name, defaultEmailDomains, hasResumeAccess, employees } = req.body;

    if (!name) {
      throw new BadRequestError("Please enter the name field at the minimum");
    }

    const newCompany = await CompanyModel.create({
      name,
      defaultEmailDomains,
      hasResumeAccess,
      employees,
    });

    return res.status(200).send(newCompany);
  })
);

companyRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const company = await CompanyModel.findById(id);

    if (!company) {
      throw new BadRequestError("Company not found");
    }
    return res.status(200).send(company);
  })
);

companyRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const company = CompanyModel.findById(id);

    if (!company) {
      throw new BadRequestError("Company not found");
    }

    const updatedCompany = await CompanyModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    return res.status(200).send(updatedCompany);
  })
);

companyRoutes.route("/:id/employees/add").post(
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const company = await CompanyModel.findById(id);

    if (!company) {
      throw new BadRequestError("Company not found");
    }

    const emails = req.body.employees.split(",");
    const newEmployees: string[] = [];

    emails.forEach(async (email: string) => {
      const user = await getAuth().getUserByEmail(email);
      newEmployees.push(user.uid);
    });

    const currEmployees = await CompanyModel.findByIdAndUpdate(
      id,
      {
        employees: company.employees.concat(newEmployees),
      },
      { new: true }
    );

    return res.status(200).send(currEmployees);
  })
);

companyRoutes.route("/:id/employees").put(
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const company = await CompanyModel.findById(id);

    if (!company) {
      throw new BadRequestError("Company not found");
    }

    const addEmployees = await CompanyModel.findByIdAndUpdate(
      id,
      {
        employees: req.body.employees,
      },
      { new: true }
    );

    return res.status(200).send(addEmployees);
  })
);
