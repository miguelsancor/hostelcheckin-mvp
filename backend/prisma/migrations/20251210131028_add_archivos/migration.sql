/*
  Warnings:

  - You are about to drop the column `archivoAnverso` on the `Huesped` table. All the data in the column will be lost.
  - You are about to drop the column `archivoReverso` on the `Huesped` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Huesped" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "nacionalidad" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "lugarProcedencia" TEXT NOT NULL,
    "lugarDestino" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motivoViaje" TEXT NOT NULL,
    "fechaIngreso" TEXT NOT NULL,
    "fechaSalida" TEXT NOT NULL,
    "numeroReserva" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkinUrl" TEXT,
    "codigoTTLock" TEXT,
    "archivoPasaporte" TEXT,
    "archivoCedula" TEXT,
    "archivoFirma" TEXT
);
INSERT INTO "new_Huesped" ("archivoPasaporte", "checkinUrl", "codigoTTLock", "creadoEn", "direccion", "email", "fechaIngreso", "fechaSalida", "id", "lugarDestino", "lugarProcedencia", "motivoViaje", "nacionalidad", "nombre", "numeroDocumento", "numeroReserva", "telefono", "tipoDocumento") SELECT "archivoPasaporte", "checkinUrl", "codigoTTLock", "creadoEn", "direccion", "email", "fechaIngreso", "fechaSalida", "id", "lugarDestino", "lugarProcedencia", "motivoViaje", "nacionalidad", "nombre", "numeroDocumento", "numeroReserva", "telefono", "tipoDocumento" FROM "Huesped";
DROP TABLE "Huesped";
ALTER TABLE "new_Huesped" RENAME TO "Huesped";
CREATE UNIQUE INDEX "Huesped_numeroReserva_key" ON "Huesped"("numeroReserva");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
