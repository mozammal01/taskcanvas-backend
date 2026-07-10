-- CreateEnum
CREATE TYPE "ShapeStatus" AS ENUM ('draft', 'reviewed');

-- AlterTable
ALTER TABLE "Shape" ADD COLUMN     "status" "ShapeStatus" NOT NULL DEFAULT 'draft';
