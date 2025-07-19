/*
  Warnings:

  - Made the column `numeroReserva` on table `Huesped` required. This step will fail if there are existing NULL values in that column.

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
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Huesped" ("creadoEn", "direccion", "email", "fechaIngreso", "fechaSalida", "id", "lugarDestino", "lugarProcedencia", "motivoViaje", "nacionalidad", "nombre", "numeroDocumento", "numeroReserva", "telefono", "tipoDocumento") SELECT "creadoEn", "direccion", "email", "fechaIngreso", "fechaSalida", "id", "lugarDestino", "lugarProcedencia", "motivoViaje", "nacionalidad", "nombre", "numeroDocumento", "numeroReserva", "telefono", "tipoDocumento" FROM "Huesped";
DROP TABLE "Huesped";
ALTER TABLE "new_Huesped" RENAME TO "Huesped";
CREATE UNIQUE INDEX "Huesped_numeroReserva_key" ON "Huesped"("numeroReserva");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
