-- AlterTable
ALTER TABLE "shift_preferences" ADD COLUMN     "isOff" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;
