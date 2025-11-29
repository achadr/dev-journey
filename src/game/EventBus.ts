import { EventEmitter } from 'eventemitter3'

// Layer types from the database schema
export type LayerType = 'BROWSER' | 'NETWORK' | 'API' | 'DATABASE'

// Game result returned when game ends
export interface GameResult {
  victory: boolean
  score: number
  time: number
  layersCompleted: number
}

// Type-safe event definitions
interface GameEvents {
  // Game lifecycle
  'game:ready': () => void
  'game:end': (result: GameResult) => void
  'game:pause': () => void
  'game:resume': () => void

  // Player events
  'player:damaged': (data: { amount: number; source: string }) => void
  'player:healed': (data: { amount: number }) => void
  'player:died': () => void

  // Progress events
  'layer:entered': (data: { layer: LayerType | string }) => void
  'layer:completed': (data: { layer: LayerType | string; score: number }) => void
  'challenge:started': (data: { type: string }) => void
  'challenge:completed': (data: { type: string; success: boolean }) => void

  // Score events
  'score:added': (data: { points: number; reason: string }) => void
}

class TypedEventBus extends EventEmitter<GameEvents> {}

export const EventBus = new TypedEventBus()
