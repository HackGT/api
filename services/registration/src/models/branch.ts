import { Schema, model } from "mongoose";

interface Branch {}

const branchSchema = new Schema<Branch>({});

const BranchModel = model<Branch>("Branch", branchSchema);
