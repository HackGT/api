/*
  Warnings:

  - The primary key for the `categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `category_id` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `category_name` on the `categories` table. All the data in the column will be lost.
  - The primary key for the `items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `item_id` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `item_name` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `location_id` on the `items` table. All the data in the column will be lost.
  - The primary key for the `locations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `location_id` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `location_name` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `location_hidden` on the `locations` table. All the data in the column will be lost.
  - The primary key for the `requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `request_id` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `request_item_id` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `requests` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `locations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_category_id_fkey";

-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_location_id_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_request_item_id_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_user_id_fkey";

-- DropIndex
DROP INDEX "locations.location_name_unique";

-- DropIndex
DROP INDEX "categories.category_name_unique";

-- AlterTable
ALTER TABLE "categories" RENAME COLUMN "category_id" TO "id";
ALTER TABLE "categories" RENAME COLUMN "category_name" TO "name";

-- AlterTable
ALTER TABLE "items" RENAME COLUMN "item_id" TO "id";
ALTER TABLE "items" RENAME COLUMN "item_name" TO "name";
ALTER TABLE "items" RENAME COLUMN "category_id" TO "categoryId";
ALTER TABLE "items" RENAME COLUMN "location_id" TO "locationId";

-- AlterTable
ALTER TABLE "locations" RENAME COLUMN "location_id" TO "id";
ALTER TABLE "locations" RENAME COLUMN "location_name" TO "name";
ALTER TABLE "locations" RENAME COLUMN "location_hidden" TO "hidden";

-- AlterTable
ALTER TABLE "requests" RENAME COLUMN "request_id" TO "id";
ALTER TABLE "requests" RENAME COLUMN "request_item_id" TO "itemId";
ALTER TABLE "requests" RENAME COLUMN "user_id" TO "userId";
ALTER TABLE "requests" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "requests" RENAME COLUMN "updated_at" TO "updatedAt";

-- CreateIndex
CREATE UNIQUE INDEX "categories.name_unique" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "locations.name_unique" ON "locations"("name");

-- AddForeignKey
ALTER TABLE "items" ADD FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD FOREIGN KEY ("userId") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
