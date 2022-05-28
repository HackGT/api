import mongoose from "mongoose";

/**
 * Follows the definition from mongoose.PopulatedDoc. Essentially a wrapper around a mongose
 * type to include the _id field when populated.
 */
export type AutoPopulatedDoc<PopulatedType> = PopulatedType & { _id: mongoose.RefType };
