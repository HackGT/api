/*
  Warnings:

  - Made the column `price` on table `items` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "items" ALTER COLUMN "imageUrl" DROP NOT NULL,
ALTER COLUMN "price" SET NOT NULL;
