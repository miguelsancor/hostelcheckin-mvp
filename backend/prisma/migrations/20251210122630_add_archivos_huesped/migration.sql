-- CreateTable
CREATE TABLE "Huesped" (
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
    "archivoAnverso" TEXT,
    "archivoReverso" TEXT,
    "archivoPasaporte" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Huesped_numeroReserva_key" ON "Huesped"("numeroReserva");
