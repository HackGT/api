/*
  Warnings:

  - The values [PARTICIPANT,JUDGE,JUDGE_AND_SPONSOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('GENERAL', 'SPONSOR', 'ADMIN');
ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isJudging" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "role" SET DEFAULT E'GENERAL';
