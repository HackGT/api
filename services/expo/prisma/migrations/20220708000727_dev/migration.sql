/*
  Warnings:

  - You are about to drop the `Winner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Winner";

-- CreateTable
CREATE TABLE "winner" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "rank" "WinnerRank" NOT NULL DEFAULT E'GENERAL',

    PRIMARY KEY ("id")
);
