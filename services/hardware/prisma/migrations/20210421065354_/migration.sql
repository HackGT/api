/*
  Warnings:

  - Changed the type of `status` on the `requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'DENIED', 'ABANDONED', 'CANCELLED', 'READY_FOR_PICKUP', 'FULFILLED', 'RETURNED', 'LOST', 'DAMAGED');

-- AlterTable
ALTER TABLE "requests" DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL;
