import mongoose from "mongoose";

export type AutoPopulatedDoc<PopulatedType> = PopulatedType & { _id: mongoose.RefType };
