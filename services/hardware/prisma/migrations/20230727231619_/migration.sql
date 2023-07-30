/*
  Warnings:

  - The primary key for the `settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "settings" DROP CONSTRAINT "settings_pkey",
DROP COLUMN "name",
DROP COLUMN "value",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "isHardwareRequestsAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");
