-- CreateTable
CREATE TABLE "workout_day_logs" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_day_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_meal_logs" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "mealEntryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diet_meal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workout_day_logs_memberId_idx" ON "workout_day_logs"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "workout_day_logs_assignmentId_date_key" ON "workout_day_logs"("assignmentId", "date");

-- CreateIndex
CREATE INDEX "diet_meal_logs_memberId_idx" ON "diet_meal_logs"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "diet_meal_logs_assignmentId_date_mealEntryId_key" ON "diet_meal_logs"("assignmentId", "date", "mealEntryId");

-- AddForeignKey
ALTER TABLE "workout_day_logs" ADD CONSTRAINT "workout_day_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_day_logs" ADD CONSTRAINT "workout_day_logs_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "workout_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_meal_logs" ADD CONSTRAINT "diet_meal_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_meal_logs" ADD CONSTRAINT "diet_meal_logs_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "diet_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_meal_logs" ADD CONSTRAINT "diet_meal_logs_mealEntryId_fkey" FOREIGN KEY ("mealEntryId") REFERENCES "meal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

