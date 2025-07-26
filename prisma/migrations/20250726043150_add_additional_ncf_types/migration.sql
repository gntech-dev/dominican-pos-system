-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NcfType" ADD VALUE 'B11';
ALTER TYPE "NcfType" ADD VALUE 'B12';
ALTER TYPE "NcfType" ADD VALUE 'B13';
ALTER TYPE "NcfType" ADD VALUE 'B14';
ALTER TYPE "NcfType" ADD VALUE 'B15';
