/*
  Warnings:

  - You are about to drop the column `hackathonId` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `hackathonId` on the `category_group` table. All the data in the column will be lost.
  - You are about to drop the column `currentHackathonId` on the `config` table. All the data in the column will be lost.
  - You are about to drop the column `hackathonId` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `hackathonId` on the `project` table. All the data in the column will be lost.
  - You are about to drop the column `hackathonId` on the `table_group` table. All the data in the column will be lost.
  - You are about to drop the column `hackathonId` on the `winner` table. All the data in the column will be lost.
  - You are about to drop the `hackathon` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `hexathon` to the `category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hexathon` to the `category_group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hackathon` to the `notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hexathon` to the `project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hexathon` to the `table_group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hexathon` to the `winner` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "category" DROP CONSTRAINT "category_hackathonId_fkey";

-- DropForeignKey
ALTER TABLE "category_group" DROP CONSTRAINT "category_group_hackathonId_fkey";

-- DropForeignKey
ALTER TABLE "config" DROP CONSTRAINT "config_currentHackathonId_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_hackathonId_fkey";

-- DropForeignKey
ALTER TABLE "project" DROP CONSTRAINT "project_hackathonId_fkey";

-- DropForeignKey
ALTER TABLE "table_group" DROP CONSTRAINT "table_group_hackathonId_fkey";

-- DropForeignKey
ALTER TABLE "winner" DROP CONSTRAINT "winner_hackathonId_fkey";

-- DropIndex
DROP INDEX "config_currentHackathonId_unique";

-- AlterTable
ALTER TABLE "category" DROP COLUMN "hackathonId",
ADD COLUMN     "hexathon" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "category_group" DROP COLUMN "hackathonId",
ADD COLUMN     "hexathon" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "config" DROP COLUMN "currentHackathonId",
ADD COLUMN     "currentHexathon" TEXT;

-- AlterTable
ALTER TABLE "notification" DROP COLUMN "hackathonId",
ADD COLUMN     "hackathon" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "project" DROP COLUMN "hackathonId",
ADD COLUMN     "hexathon" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "table_group" DROP COLUMN "hackathonId",
ADD COLUMN     "hexathon" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "winner" DROP COLUMN "hackathonId",
ADD COLUMN     "hexathon" TEXT NOT NULL;

-- DropTable
DROP TABLE "hackathon";
