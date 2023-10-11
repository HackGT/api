/*
  Warnings:

  - You are about to drop the column `isJudging` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `isSponsor` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_isJudging_idx";

-- DropIndex
DROP INDEX "user_isSponsor_idx";

-- AlterTable
ALTER TABLE "category_group" ADD COLUMN     "isSponsor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "isJudging",
DROP COLUMN "isSponsor";
