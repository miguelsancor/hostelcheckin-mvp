/*
  Warnings:

  - You are about to drop the column `nombreCompleto` on the `Huesped` table. All the data in the column will be lost.
  - Added the required column `nombre` to the `Huesped` table without a default value. This is not possible if the table is not empty.

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
    "numeroReserva" TEXT DEFAULT '',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Huesped" ("creadoEn", "direccion", "email", "fechaIngreso", "fechaSalida", "id", "lugarDestino", "lugarProcedencia", "motivoViaje", "nacionalidad", "numeroDocumento", "telefono", "tipoDocumento") SELECT "creadoEn", "direccion", "email", "fechaIngreso", "fechaSalida", "id", "lugarDestino", "lugarProcedencia", "motivoViaje", "nacionalidad", "numeroDocumento", "telefono", "tipoDocumento" FROM "Huesped";
DROP TABLE "Huesped";
ALTER TABLE "new_Huesped" RENAME TO "Huesped";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
