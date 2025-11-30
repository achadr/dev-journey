import { EventEmitter } from 'eventemitter3'

// Layer types from the database schema
export type LayerType = 'BROWSER' | 'NETWORK' | 'API' | 'DATABASE'

// Handshake token types for TCP 3-way handshake
export type HandshakeToken = 'SYN' | 'SYN-ACK' | 'ACK'

// Packet parts for assembly
export type PacketPart = 'header' | 'payload' | 'checksum'

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
  'player:damaged': (data: { amount: number; source: string; explanation?: string }) => void
  'player:healed': (data: { amount: number }) => void
  'player:died': () => void

  // Progress events
  'layer:entered': (data: { layer: LayerType | string }) => void
  'layer:completed': (data: { layer: LayerType | string; score: number }) => void
  'challenge:started': (data: { type: string }) => void
  'challenge:completed': (data: { type: string; success: boolean }) => void

  // Score events
  'score:added': (data: { points: number; reason: string }) => void

  // TCP Handshake events (educational)
  'handshake:collected': (data: { token: HandshakeToken; collected: HandshakeToken[] }) => void
  'handshake:complete': () => void
  'handshake:failed': (data: { reason: string }) => void

  // Packet assembly events (educational)
  'packet:part': (data: { part: PacketPart; collected: PacketPart[]; inOrder: boolean }) => void
  'packet:assembled': (data: { bonus: boolean }) => void

  // Educational popup events
  'education:show': (data: { title: string; message: string; type: 'info' | 'warning' | 'success' }) => void
  'education:hide': () => void
}

class TypedEventBus extends EventEmitter<GameEvents> {}

export const EventBus = new TypedEventBus()
