-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_gymId_fkey";

-- DropIndex
DROP INDEX "users_gymId_email_key";

-- AlterTable
ALTER TABLE "diet_plans" ADD COLUMN     "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "bodyFatPercent" DOUBLE PRECISION,
ADD COLUMN     "location" TEXT,
ALTER COLUMN "gymId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "gymId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "workout_plans" ADD COLUMN     "createdByUserId" TEXT;

-- CreateTable
CREATE TABLE "body_measurements" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "bodyFatPercent" DOUBLE PRECISION,
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "body_measurements_memberId_idx" ON "body_measurements"("memberId");

-- CreateIndex
CREATE INDEX "body_measurements_recordedAt_idx" ON "body_measurements"("recordedAt");

-- CreateIndex
CREATE INDEX "diet_plans_createdByUserId_idx" ON "diet_plans"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_name_email_key" ON "users"("name", "email");

-- CreateIndex
CREATE INDEX "workout_plans_createdByUserId_idx" ON "workout_plans"("createdByUserId");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

