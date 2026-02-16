-- CreateTable
CREATE TABLE "TraRegistro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "huespedId" INTEGER NOT NULL,
    "numeroReserva" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "padreCode" INTEGER,
    "code" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" DATETIME,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TraRegistro_huespedId_fkey" FOREIGN KEY ("huespedId") REFERENCES "Huesped" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TraRegistro_numeroReserva_idx" ON "TraRegistro"("numeroReserva");

-- CreateIndex
CREATE INDEX "TraRegistro_huespedId_idx" ON "TraRegistro"("huespedId");

-- CreateIndex
CREATE INDEX "TraRegistro_status_idx" ON "TraRegistro"("status");

-- CreateIndex
CREATE INDEX "TraRegistro_endpoint_idx" ON "TraRegistro"("endpoint");
