/*
  Warnings:

  - Added the required column `uuid` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "uuid" TEXT NOT NULL,
ADD COLUMN     "token" TEXT NOT NULL;
