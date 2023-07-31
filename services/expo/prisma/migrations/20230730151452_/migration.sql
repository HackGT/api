/*
  Warnings:

  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `notification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_senderId_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role";

-- DropTable
DROP TABLE "notification";

-- DropEnum
DROP TYPE "UserRole";
