/*
  Warnings:

  - You are about to drop the column `accessLevel` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "accessLevel";

-- DropTable
DROP TABLE "Session";

-- DropEnum
DROP TYPE "AccessLevel";
