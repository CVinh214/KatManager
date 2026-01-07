/*
  Warnings:

  - You are about to drop the `holidays` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "holidays";

-- CreateTable
CREATE TABLE "revenue_estimates" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "estimatedRevenue" DOUBLE PRECISION NOT NULL,
    "actualRevenue" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "revenue_estimates_date_idx" ON "revenue_estimates"("date");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_estimates_date_key" ON "revenue_estimates"("date");
