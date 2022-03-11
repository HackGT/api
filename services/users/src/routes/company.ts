import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";
import { getAuth } from "firebase-admin/auth"; // eslint-disable-line import/no-unresolved

import { CompanyModel } from "../models/company";

export const companyRoutes = express.Router();

companyRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const { name, defaultEmailDomains, hasResumeAccess, employees } = req.body;

    if (!name) {
      res.status(400);
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
    const {id} = req.params;
    const company = await CompanyModel.findById(id);

    if (!company) {
      res.status(400);
      throw new BadRequestError("Company not found");
    }
    return res.status(200).send(company);
  })
);

companyRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    const {id} = req.params;
    const company = CompanyModel.findById(id);

    if (!company) {
      res.status(400);
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
    const {id} = req.params;
    const company = await CompanyModel.findById(id);

    if (!company) {
      res.status(400);
      throw new BadRequestError("Company not found");
    }

    const emails = req.body.split(",");
    const newEmployees: string[] = [];

    emails.forEach(async (index: number) => {
      const email = emails[index];
      const getUser = await getAuth().getUserByEmail(email);
      const getUid = getUser.uid;
      newEmployees.push(getUid);
    });
    // }) {
    //     var email = emails[i];
    //     var getUser = getAuth().getUserByEmail(email);
    //     var getUid = (await getUser).uid
    //     newEmployees.push(getUid);
    // }

    const addEmployees = await CompanyModel.findByIdAndUpdate(id, {
      employees: newEmployees,
    });

    return res.status(200).send(addEmployees);
  })
);

companyRoutes.route("/:id/employees").put(
  asyncHandler(async (req, res) => {
    const {id} = req.params;
    const company = await CompanyModel.findById(id);

    if (!company) {
      res.status(400);
      throw new BadRequestError("Company not found");
    }

    const addEmployees = await CompanyModel.findByIdAndUpdate(
      id,
      {
        employees: req.body,
      },
      { new: true }
    );

    return res.status(200).send(addEmployees);
  })
);
