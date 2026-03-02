-- CreateTable
CREATE TABLE "SyncData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SyncData_userId_athleteId_idx" ON "SyncData"("userId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncData_userId_athleteId_kind_key" ON "SyncData"("userId", "athleteId", "kind");
