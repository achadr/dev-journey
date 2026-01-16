/**
 * Achievement Checking Logic
 * Determines which achievements should be unlocked based on user actions
 */

import { prisma } from '@/lib/db/client'

interface CheckAchievementsParams {
  userId: string
  event: 'quest_completed' | 'layer_completed' | 'challenge_completed'
  data: {
    questId?: string
    layerType?: string
    layerTime?: number
    damageTaken?: number
    challengeType?: string
  }
}

/**
 * Check and unlock achievements for a user based on their actions
 */
export async function checkAndUnlockAchievements(params: CheckAchievementsParams) {
  const { userId, event, data } = params
  const unlockedAchievements: string[] = []

  try {
    // Get all achievements
    const allAchievements = await prisma.achievement.findMany()

    // Get user's already unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    })

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId))

    // Get user's progress for counting
    const userProgress = await prisma.progress.findMany({
      where: { userId },
      include: {
        layerProgress: true,
      },
    })

    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) continue

      const condition = achievement.condition as any
      let shouldUnlock = false

      // Check based on achievement conditions
      switch (event) {
        case 'quest_completed':
          // "First Steps" - Complete your first quest
          if (condition.questsCompleted) {
            const completedQuests = userProgress.filter((p) => p.completed).length
            shouldUnlock = completedQuests >= condition.questsCompleted
          }

          // "Perfect Run" - Complete a quest without taking damage
          if (condition.noDamage && data.damageTaken === 0) {
            shouldUnlock = true
          }
          break

        case 'layer_completed':
          // "Speed Demon" - Complete a network layer in under 30 seconds
          if (
            condition.layerType &&
            condition.maxTime &&
            data.layerType === condition.layerType &&
            data.layerTime &&
            data.layerTime <= condition.maxTime
          ) {
            shouldUnlock = true
          }
          break

        case 'challenge_completed':
          // Count-based achievements (e.g., "Query Master", "API Expert")
          if (condition.challengeType && condition.count) {
            // Count how many times the user completed this challenge type
            let count = 0
            for (const progress of userProgress) {
              if (progress.layerProgress) {
                count += progress.layerProgress.filter(
                  (lp) => lp.completed
                ).length
              }
            }

            // For more specific checking, we'd need to track challenge types per layer
            // This is a simplified version - can be enhanced later
            shouldUnlock = count >= condition.count
          }
          break
      }

      // Unlock the achievement if conditions are met
      if (shouldUnlock) {
        try {
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
            },
          })

          // Increment user XP
          await prisma.user.update({
            where: { id: userId },
            data: {
              xp: {
                increment: achievement.xpReward,
              },
            },
          })

          unlockedAchievements.push(achievement.id)
        } catch (error) {
          // Ignore duplicate key errors (race condition)
          console.error('Failed to unlock achievement:', error)
        }
      }
    }

    return unlockedAchievements
  } catch (error) {
    console.error('Achievement check failed:', error)
    return []
  }
}
