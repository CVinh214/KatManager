-- CreateIndex
CREATE INDEX "shifts_employeeId_date_idx" ON "shifts"("employeeId", "date");

-- CreateIndex
CREATE INDEX "shifts_date_status_idx" ON "shifts"("date", "status");

-- CreateIndex
CREATE INDEX "time_logs_employeeId_date_idx" ON "time_logs"("employeeId", "date");
