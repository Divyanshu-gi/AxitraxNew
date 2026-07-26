/*
  Warnings:

  - You are about to drop the column `durationSeconds` on the `exercises` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `exercises` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `exercises` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "exercises" DROP COLUMN "durationSeconds",
DROP COLUMN "thumbnailUrl",
DROP COLUMN "videoUrl";

-- CreateTable
CREATE TABLE "exercise_videos" (
    "id" TEXT NOT NULL,
    "exerciseSlug" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercise_videos_exerciseSlug_key" ON "exercise_videos"("exerciseSlug");
