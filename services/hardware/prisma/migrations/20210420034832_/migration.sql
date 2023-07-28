-- CreateTable
CREATE TABLE "categories" (
    "category_id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,

    PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "items" (
    "item_id" SERIAL NOT NULL,
    "item_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "totalAvailable" INTEGER NOT NULL,
    "maxRequestQty" INTEGER NOT NULL,
    "price" DECIMAL(6,2) DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "returnRequired" BOOLEAN NOT NULL DEFAULT true,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "owner" TEXT NOT NULL,
    "location_id" INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "locations" (
    "location_id" SERIAL NOT NULL,
    "location_name" TEXT NOT NULL,
    "location_hidden" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "requests" (
    "request_id" SERIAL NOT NULL,
    "request_item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "settings" (
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "users" (
    "uuid" UUID NOT NULL,
    "token" VARCHAR(256),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "slackUsername" TEXT NOT NULL,
    "haveID" BOOLEAN NOT NULL DEFAULT false,
    "admin" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories.category_name_unique" ON "categories"("category_name");

-- CreateIndex
CREATE UNIQUE INDEX "locations.location_name_unique" ON "locations"("location_name");

-- AddForeignKey
ALTER TABLE "items" ADD FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD FOREIGN KEY ("request_item_id") REFERENCES "items"("item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
