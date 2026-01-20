/**
 * Leaderboard API Client
 * Utility functions for fetching leaderboard data
 */

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time'

export interface LeaderboardEntry {
  id: string
  userId: string
  username: string
  totalScore: number
  questsCompleted: number
  rank: number | null
  period: string
  periodStart: Date
  periodEnd: Date
  updatedAt: Date
}

export interface UserRank {
  rank: number | null
  username: string
  totalScore: number
  questsCompleted: number
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  userRank: UserRank | null
}

export interface LeaderboardOptions {
  period?: LeaderboardPeriod
  page?: number
  limit?: number
}

/**
 * Fetch leaderboard entries
 */
export async function getLeaderboard(
  options: LeaderboardOptions = {}
): Promise<LeaderboardResponse> {
  const { period = 'all-time', page = 1, limit = 10 } = options

  const params = new URLSearchParams({
    period,
    page: String(page),
    limit: String(limit),
  })

  const response = await fetch(`/api/leaderboard?${params}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to fetch leaderboard')
  }

  return result.data
}
