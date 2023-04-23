import { IResolvers } from "apollo-server-express";
import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { and, shield } from "graphql-shield";

import {
  canCancel,
  canEdit,
  canEditRule,
  canExpense,
  canExpenseRule,
  canViewAdminPanel,
  fallbackRule,
  isAuthenticatedRule,
  isExecRule,
} from "./permissions";
import { Query } from "./resolvers/query";
import { Mutation } from "./resolvers/mutation";
import { getFileLink } from "../util/googleUpload";
import { projectReferenceString, requisitionReferenceString } from "./resolvers/common";

export const permissions = shield(
  {
    Query: {
      "*": isAuthenticatedRule,
    },
    Mutation: {
      updateUser: and(isAuthenticatedRule, isExecRule),
      createRequisition: isAuthenticatedRule,
      updateRequisition: and(isAuthenticatedRule, canEditRule),
      createProject: and(isAuthenticatedRule, isExecRule),
      updateProject: and(isAuthenticatedRule, isExecRule),
      createVendor: and(isAuthenticatedRule, isExecRule),
      updateVendor: and(isAuthenticatedRule, isExecRule),
      createBudget: and(isAuthenticatedRule, isExecRule),
      updateBudget: and(isAuthenticatedRule, isExecRule),
      createPaymentMethod: and(isAuthenticatedRule, isExecRule),
      updatePaymentMethod: and(isAuthenticatedRule, isExecRule),
      createPayment: and(isAuthenticatedRule, isExecRule),
      createApproval: and(isAuthenticatedRule, canExpenseRule),
      createLineItem: and(isAuthenticatedRule, isExecRule),
      updateLineItem: and(isAuthenticatedRule, isExecRule),
      createCategory: and(isAuthenticatedRule, isExecRule),
      updateCategory: and(isAuthenticatedRule, isExecRule),
    },
  },
  {
    allowExternalErrors: true,
    fallbackRule,
    fallbackError: "Sorry, you don't have access. Please contact a tech team member for help.",
  }
);

export const resolvers: IResolvers = {
  Query,
  Mutation,
  ID: new GraphQLScalarType({
    name: "ID",
    description: "ID custom scalar type string to int",
    parseValue(value: any) {
      return parseInt(value); // value from the client
    },
    serialize(value: any) {
      return value.toString(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value); // ast value is always in string format
      }
      return null;
    },
  }),
  Date: new GraphQLScalarType({
    name: "Date",
    description: "Date custom scalar type",
    parseValue(value: any) {
      return new Date(value); // value from the client
    },
    serialize(value: any) {
      return value.toISOString(); // value sent to the client
    },
    parseLiteral(ast): any {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value); // ast value is always in string format
      }
      return null;
    },
  }),
  Upload: new GraphQLScalarType({
    // Based off graphql-upload library
    name: "Upload",
    description: "The `Upload` scalar type represents a file upload.",
    parseValue(value: any) {
      if (value.originFileObj?.promise instanceof Promise || value.signedUrl) {
        return value;
      }

      throw new GraphQLError("Upload value invalid.");
    },
    parseLiteral(ast) {
      throw new GraphQLError("Upload literal unsupported.", ast);
    },
    serialize() {
      throw new GraphQLError("Upload serialization unsupported.");
    },
  }),
  User: {
    canViewAdminPanel,
  },
  Requisition: {
    canEdit,
    canCancel,
    canExpense,
    referenceString: (parent: any) => requisitionReferenceString(parent),
    files: (parent: any) => parent.files.filter((file: any) => file.isActive), // Filter so only active files are sent to client
  },
  Project: {
    referenceString: (parent: any) => projectReferenceString(parent),
  },
  File: {
    signedUrl: (parent: any) => getFileLink(parent),
  },
};
