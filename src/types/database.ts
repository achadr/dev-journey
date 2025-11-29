// Re-export Prisma types for use across the application
export type {
  User,
  Quest,
  Layer,
  Challenge,
  Progress,
  LayerProgress,
  Achievement,
  UserAchievement,
  LeaderboardEntry,
  UserRole,
  LayerType,
  ChallengeType,
  AchievementCategory,
  LeaderboardPeriod,
} from '@prisma/client'

// Extended types with relations
export type QuestWithLayers = Awaited<ReturnType<typeof import('@/lib/db/queries').getQuestWithLayers>>
export type UserProgressWithQuest = Awaited<ReturnType<typeof import('@/lib/db/queries').getUserProgress>>[number]
