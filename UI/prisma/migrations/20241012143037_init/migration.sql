-- CreateTable
CREATE TABLE "User" (
    "walletAddress" TEXT NOT NULL,
    "escrows" TEXT[]
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
