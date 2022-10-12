/*
  Warnings:

  - Made the column `currentHackathonId` on table `config` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "config" ALTER COLUMN "currentHackathonId" SET NOT NULL;
