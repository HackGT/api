/*
  Warnings:

  - You are about to drop the column `owner` on the `item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "item" DROP COLUMN "owner",
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "maxRequestQty" SET DEFAULT 1,
ALTER COLUMN "locationId" DROP DEFAULT;
