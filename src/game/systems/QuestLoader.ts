export interface QuestLayer {
  type: string
  challenge: {
    type: string
    config?: Record<string, unknown>
  }
  order?: number
  timeLimit?: number
}

export interface Quest {
  id: string
  name: string
  description?: string
  difficulty?: number
  layers: QuestLayer[]
}

export class QuestLoader {
  private cache: Map<string, Quest> = new Map()

  async load(questId: string): Promise<Quest> {
    // Check cache first
    if (this.cache.has(questId)) {
      return this.cache.get(questId)!
    }

    // Fetch from API
    const response = await fetch(`/api/quests/${questId}`)

    if (!response.ok) {
      throw new Error(`Failed to load quest: ${questId}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(`Failed to load quest: ${questId}`)
    }

    const quest: Quest = result.data

    // Validate quest structure
    this.validate(quest)

    // Cache for future use
    this.cache.set(questId, quest)

    return quest
  }

  private validate(quest: Quest): void {
    if (!quest.id || !quest.name || !quest.layers) {
      throw new Error('Invalid quest structure')
    }

    if (quest.layers.length === 0) {
      throw new Error('Quest must have at least one layer')
    }

    for (const layer of quest.layers) {
      if (!layer.type || !layer.challenge) {
        throw new Error('Invalid layer structure')
      }
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  isCached(questId: string): boolean {
    return this.cache.has(questId)
  }
}
