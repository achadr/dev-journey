/**
 * Progress API Client
 * Utility functions for saving and loading player progress
 */

interface LayerProgressData {
  layerIndex: number
  score: number
  completed: boolean
  timeSpent: number
}

interface SaveProgressData {
  questId: string
  layerIndex: number
  score: number
  completed: boolean
  timeSpent: number
  layerProgress?: LayerProgressData[]
}

export async function saveProgress(data: SaveProgressData) {
  const response = await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to save progress')
  }

  return result.data.progress
}

export async function getProgress() {
  const response = await fetch('/api/progress')
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to load progress')
  }

  return result.data.progress
}

export async function getQuestProgress(questId: string) {
  const response = await fetch(`/api/progress/${questId}`)
  const result = await response.json()

  if (!response.ok) {
    if (response.status === 404) {
      // No progress yet - return null
      return null
    }
    throw new Error(result.error?.message || 'Failed to load quest progress')
  }

  return result.data.progress
}
