-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'CREATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "LayerType" AS ENUM ('BROWSER', 'NETWORK', 'API', 'DATABASE');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('SELECT_METHOD', 'BUILD_REQUEST', 'ADD_HEADERS', 'PLATFORMER', 'DODGE_OBSTACLES', 'PACKET_RACE', 'PICK_ENDPOINT', 'MIDDLEWARE_SEQUENCE', 'STATUS_CODE_MATCH', 'SELECT_QUERY', 'WRITE_QUERY', 'FIX_QUERY');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('PROGRESS', 'SKILL', 'SPEED', 'COLLECTION', 'SOCIAL');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "thumbnailUrl" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Layer" (
    "id" TEXT NOT NULL,
    "type" "LayerType" NOT NULL,
    "order" INTEGER NOT NULL,
    "timeLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questId" TEXT NOT NULL,

    CONSTRAINT "Layer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "config" JSONB NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "timeBonus" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "layerId" TEXT NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "layerIndex" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "bestTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LayerProgress" (
    "id" TEXT NOT NULL,
    "layerIndex" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "progressId" TEXT NOT NULL,

    CONSTRAINT "LayerProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "condition" JSONB NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "questsCompleted" INTEGER NOT NULL,
    "rank" INTEGER,
    "period" "LeaderboardPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "Quest_authorId_idx" ON "Quest"("authorId");

-- CreateIndex
CREATE INDEX "Quest_difficulty_idx" ON "Quest"("difficulty");

-- CreateIndex
CREATE INDEX "Quest_isPublic_isActive_idx" ON "Quest"("isPublic", "isActive");

-- CreateIndex
CREATE INDEX "Layer_questId_idx" ON "Layer"("questId");

-- CreateIndex
CREATE UNIQUE INDEX "Layer_questId_order_key" ON "Layer"("questId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_layerId_key" ON "Challenge"("layerId");

-- CreateIndex
CREATE INDEX "Progress_userId_idx" ON "Progress"("userId");

-- CreateIndex
CREATE INDEX "Progress_questId_idx" ON "Progress"("questId");

-- CreateIndex
CREATE INDEX "Progress_completed_idx" ON "Progress"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_questId_key" ON "Progress"("userId", "questId");

-- CreateIndex
CREATE INDEX "LayerProgress_progressId_idx" ON "LayerProgress"("progressId");

-- CreateIndex
CREATE UNIQUE INDEX "LayerProgress_progressId_layerIndex_key" ON "LayerProgress"("progressId", "layerIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_name_key" ON "Achievement"("name");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_period_periodStart_totalScore_idx" ON "LeaderboardEntry"("period", "periodStart", "totalScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_userId_period_periodStart_key" ON "LeaderboardEntry"("userId", "period", "periodStart");

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Layer" ADD CONSTRAINT "Layer_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "Layer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayerProgress" ADD CONSTRAINT "LayerProgress_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "Progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
