/**
 * Achievement API Client
 * Utility functions for fetching and unlocking achievements
 */

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  condition: Record<string, unknown>
  xpReward: number
  createdAt: Date
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  unlockedAt: Date
  achievement: Achievement
}

/**
 * Fetch all unlocked achievements for the current user
 */
export async function getUnlockedAchievements(): Promise<UserAchievement[]> {
  const response = await fetch('/api/achievements')
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to fetch achievements')
  }

  return result.data.achievements
}

/**
 * Fetch all available (not yet unlocked) achievements
 */
export async function getAvailableAchievements(): Promise<Achievement[]> {
  const response = await fetch('/api/achievements/available')
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to fetch available achievements')
  }

  return result.data.achievements
}

/**
 * Manually unlock an achievement (primarily for admin/testing)
 */
export async function unlockAchievement(achievementId: string) {
  const response = await fetch('/api/achievements/unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ achievementId }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to unlock achievement')
  }

  return result.data
}
