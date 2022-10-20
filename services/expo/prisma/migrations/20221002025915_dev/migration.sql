-- CreateTable
CREATE TABLE "_UserToWinner" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserToWinner_AB_unique" ON "_UserToWinner"("A", "B");

-- CreateIndex
CREATE INDEX "_UserToWinner_B_index" ON "_UserToWinner"("B");

-- AddForeignKey
ALTER TABLE "_UserToWinner" ADD FOREIGN KEY ("A") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToWinner" ADD FOREIGN KEY ("B") REFERENCES "winner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
