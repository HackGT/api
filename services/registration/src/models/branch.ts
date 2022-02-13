import { Schema, model } from "mongoose";

interface Branch {
    name: string;
    type: string;
    settings:{
        open: Date,
        close:Date;
    }
}

const branchSchema = new Schema<Branch>({
    name: { type: String, required: true },
    type: { type: String, required: true },
    settings:{type: String, required: true} 
});

const BranchModel = model<Branch>("Branch", branchSchema);
