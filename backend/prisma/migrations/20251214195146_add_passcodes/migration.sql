-- CreateTable
CREATE TABLE "Passcode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "huespedId" INTEGER NOT NULL,
    "lockId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "keyboardPwdId" INTEGER,
    "tipo" TEXT NOT NULL,
    "startDate" INTEGER NOT NULL,
    "endDate" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Passcode_huespedId_fkey" FOREIGN KEY ("huespedId") REFERENCES "Huesped" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Passcode_huespedId_idx" ON "Passcode"("huespedId");

-- CreateIndex
CREATE INDEX "Passcode_lockId_idx" ON "Passcode"("lockId");
