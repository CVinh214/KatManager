/*
  Warnings:

  - Changed the type of `position` on the `time_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable: Convert Position enum to TEXT while preserving data
ALTER TABLE "time_logs" 
ALTER COLUMN "position" TYPE TEXT USING position::TEXT;
