-- CreateTable University
CREATE TABLE "University" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "country"   TEXT NOT NULL DEFAULT 'DO',
    "logoUrl"   TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- Insertar ITLA como primera universidad (mismo id que usará el seed)
INSERT INTO "University" ("id", "name", "shortName", "country")
VALUES ('university-itla', 'Instituto Tecnológico de Las Américas', 'ITLA', 'DO');

-- AddColumn universityId a Career con valor por defecto para la fila existente
ALTER TABLE "Career" ADD COLUMN "universityId" TEXT NOT NULL DEFAULT 'university-itla';

-- Quitar el default ahora que ya se aplicó
ALTER TABLE "Career" ALTER COLUMN "universityId" DROP DEFAULT;

-- Eliminar columna university (string)
ALTER TABLE "Career" DROP COLUMN "university";

-- AddForeignKey
ALTER TABLE "Career" ADD CONSTRAINT "Career_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
