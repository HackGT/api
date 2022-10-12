-- CreateEnum
CREATE TYPE "WinnerRank" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'GENERAL');

-- CreateTable
CREATE TABLE "Winner" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "rank" "WinnerRank" NOT NULL DEFAULT E'GENERAL',

    PRIMARY KEY ("id")
);
