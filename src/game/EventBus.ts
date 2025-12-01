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

  // API Layer events (educational)
  'method:collected': (data: { method: string; collected: string[] }) => void
  'header:collected': (data: { header: string; collected: string[] }) => void
  'auth:acquired': (data: { token: string; headers: string[] }) => void
  'request:success': (data: { endpoint: string; method: string; statusCode: number }) => void
  'request:failed': (data: { endpoint: string; method: string; statusCode: number; reason: string }) => void
  'statuscode:learned': (data: { code: number; name: string }) => void
  'crud:complete': (data: Record<string, never>) => void

  // Browser Layer events (educational)
  'method:selected': (data: { method: string }) => void
  'url:set': (data: { url: string }) => void
  'header:added': (data: { header: string; value: string }) => void
  'header:removed': (data: { header: string }) => void
  'body:set': (data: { body: Record<string, unknown> }) => void
  'body:cleared': (data: Record<string, never>) => void
  'request:built': (data: { method: string; url: string; headers: Array<{ name: string; value: string }>; body: Record<string, unknown> | null }) => void
  'request:invalid': (data: { reason: string }) => void
  'request:reset': (data: Record<string, never>) => void
  'hint:shown': (data: { hint: string }) => void

  // Educational popup events
  'education:show': (data: { title: string; message: string; type: 'info' | 'warning' | 'success' | 'error' }) => void
  'education:hide': () => void

  // Theme-based collectible events
  'theme:init': (data: { theme: string; themeConfig: { name: string; description: string; collectibles: Array<{ id: string; label: string }> }; collectibles: Array<{ id: string; label: string; order: number }> }) => void
  'collectible:collected': (data: { id: string; label: string; order: number; inOrder: boolean; collected: string[]; theme: string }) => void
  'collectibles:complete': (data: { theme: string; bonus: boolean }) => void
}

class TypedEventBus extends EventEmitter<GameEvents> {}

export const EventBus = new TypedEventBus()
