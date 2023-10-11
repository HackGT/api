/*
  Warnings:

  - The values [STARTED] on the enum `AssignmentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentStatus_new" AS ENUM ('QUEUED', 'COMPLETED', 'SKIPPED');
ALTER TABLE "assignment" ALTER COLUMN "status" TYPE "AssignmentStatus_new" USING ("status"::text::"AssignmentStatus_new");
ALTER TYPE "AssignmentStatus" RENAME TO "AssignmentStatus_old";
ALTER TYPE "AssignmentStatus_new" RENAME TO "AssignmentStatus";
DROP TYPE "AssignmentStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "assignment" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
