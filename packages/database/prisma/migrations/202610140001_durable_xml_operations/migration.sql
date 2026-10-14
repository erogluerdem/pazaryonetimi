CREATE TABLE "DataOperation" (
 "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "kind" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'queued', "payloadEncrypted" TEXT NOT NULL,
 "idempotencyKey" TEXT NOT NULL, "sourceId" TEXT,
 "cursor" INTEGER NOT NULL DEFAULT 0, "total" INTEGER NOT NULL DEFAULT 0,
 "created" INTEGER NOT NULL DEFAULT 0, "updated" INTEGER NOT NULL DEFAULT 0,
 "attempts" INTEGER NOT NULL DEFAULT 0, "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "leaseUntil" TIMESTAMP(3), "leaseToken" TEXT, "error" TEXT, "result" JSONB,
 "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "DataOperation_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "DataOperation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DataOperation_tenantId_idempotencyKey_key" ON "DataOperation"("tenantId", "idempotencyKey");
CREATE INDEX "DataOperation_status_availableAt_leaseUntil_idx" ON "DataOperation"("status", "availableAt", "leaseUntil");
CREATE INDEX "DataOperation_tenantId_createdAt_idx" ON "DataOperation"("tenantId", "createdAt");
CREATE INDEX "DataOperation_tenantId_sourceId_status_idx" ON "DataOperation"("tenantId", "sourceId", "status");
