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
  id: z.string().uuid('Invalid quest ID'),
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

export const saveProgressSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  questId: z.string().uuid('Invalid quest ID'),
  layerIndex: z.number().min(0),
  score: z.number().min(0),
  completed: z.boolean(),
  timeSpent: z.number().min(0), // in seconds
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
// TYPE EXPORTS
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type QuestQuery = z.infer<typeof questQuerySchema>
export type SaveProgressInput = z.infer<typeof saveProgressSchema>
export type CreateQuestInput = z.infer<typeof createQuestSchema>
export type UpdateQuestInput = z.infer<typeof updateQuestSchema>
