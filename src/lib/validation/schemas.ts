import { z } from 'zod'

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// ============================================
// QUEST SCHEMAS
// ============================================

export const questIdSchema = z.object({
  id: z.string().min(1, 'Quest ID is required'),
})

export const questQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  difficulty: z.coerce.number().min(1).max(5).optional(),
  search: z.string().optional(),
})

// ============================================
// PROGRESS SCHEMAS
// ============================================

export const layerProgressSchema = z.object({
  layerIndex: z.number().min(0),
  score: z.number().min(0),
  completed: z.boolean(),
  timeSpent: z.number().min(0), // in seconds
})

export const saveProgressSchema = z.object({
  questId: z.string().min(1, 'Quest ID is required'),
  layerIndex: z.number().min(0),
  score: z.number().min(0),
  completed: z.boolean(),
  timeSpent: z.number().min(0), // in seconds
  layerProgress: z.array(layerProgressSchema).optional(),
})

export const questIdParamSchema = z.object({
  questId: z.string().min(1, 'Quest ID is required'),
})

// ============================================
// EDITOR SCHEMAS
// ============================================

export const createQuestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  difficulty: z.number().min(1).max(5),
  layers: z.array(z.object({
    type: z.enum(['BROWSER', 'NETWORK', 'API', 'DATABASE']),
    challenge: z.object({
      type: z.string(),
      config: z.record(z.unknown()),
    }),
  })).min(1, 'Quest must have at least one layer'),
})

export const updateQuestSchema = createQuestSchema.partial()

// ============================================
// ACHIEVEMENT SCHEMAS
// ============================================

export const unlockAchievementSchema = z.object({
  achievementId: z.string().min(1, 'Achievement ID is required'),
})

// ============================================
// LEADERBOARD SCHEMAS
// ============================================

export const leaderboardQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'all-time']).default('all-time'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
})

// ============================================
// TYPE EXPORTS
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type QuestQuery = z.infer<typeof questQuerySchema>
export type SaveProgressInput = z.infer<typeof saveProgressSchema>
export type LayerProgressInput = z.infer<typeof layerProgressSchema>
export type CreateQuestInput = z.infer<typeof createQuestSchema>
export type UpdateQuestInput = z.infer<typeof updateQuestSchema>
export type UnlockAchievementInput = z.infer<typeof unlockAchievementSchema>
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>
