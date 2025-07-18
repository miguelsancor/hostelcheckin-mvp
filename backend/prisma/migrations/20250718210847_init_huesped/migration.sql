-- CreateTable
CREATE TABLE "Huesped" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombreCompleto" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "nacionalidad" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "lugarProcedencia" TEXT NOT NULL,
    "lugarDestino" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motivoViaje" TEXT NOT NULL,
    "fechaIngreso" DATETIME NOT NULL,
    "fechaSalida" DATETIME NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
