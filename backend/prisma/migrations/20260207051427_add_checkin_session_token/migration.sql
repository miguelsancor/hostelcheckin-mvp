/*
  Warnings:

  - You are about to alter the column `endDate` on the `Passcode` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `startDate` on the `Passcode` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- CreateTable
CREATE TABLE "CheckinSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroReserva" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "checkinUrl" TEXT,
    "payload" JSONB,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiracion" DATETIME NOT NULL,
    "usadoEn" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Passcode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "huespedId" INTEGER NOT NULL,
    "lockId" INTEGER NOT NULL,
    "lockAlias" TEXT,
    "codigo" TEXT,
    "keyboardPwdId" INTEGER,
    "tipo" TEXT NOT NULL,
    "startDate" BIGINT NOT NULL,
    "endDate" BIGINT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "ttlockOk" BOOLEAN NOT NULL DEFAULT true,
    "ttlockMessage" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Passcode_huespedId_fkey" FOREIGN KEY ("huespedId") REFERENCES "Huesped" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Passcode" ("codigo", "creadoEn", "endDate", "estado", "huespedId", "id", "keyboardPwdId", "lockId", "startDate", "tipo") SELECT "codigo", "creadoEn", "endDate", "estado", "huespedId", "id", "keyboardPwdId", "lockId", "startDate", "tipo" FROM "Passcode";
DROP TABLE "Passcode";
ALTER TABLE "new_Passcode" RENAME TO "Passcode";
CREATE INDEX "Passcode_huespedId_idx" ON "Passcode"("huespedId");
CREATE INDEX "Passcode_lockId_idx" ON "Passcode"("lockId");
CREATE INDEX "Passcode_keyboardPwdId_idx" ON "Passcode"("keyboardPwdId");
CREATE UNIQUE INDEX "Passcode_lockId_keyboardPwdId_key" ON "Passcode"("lockId", "keyboardPwdId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CheckinSession_numeroReserva_key" ON "CheckinSession"("numeroReserva");

-- CreateIndex
CREATE UNIQUE INDEX "CheckinSession_token_key" ON "CheckinSession"("token");
