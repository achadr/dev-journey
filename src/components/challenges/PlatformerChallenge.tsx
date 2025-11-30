'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { EventBus, HandshakeToken, PacketPart } from '@/game/EventBus'
import { CheckCircle, XCircle, Gamepad2, Network, Package, Info, AlertTriangle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// Game dimensions (must match config)
const GAME_WIDTH = 1280
const GAME_HEIGHT = 720

interface PlatformConfig {
  x: number
  y: number
  width: number
  height?: number
}

interface ObstacleConfig {
  x: number
  y: number
  type: string
}

interface PlatformerConfig {
  levelLength?: number
  platforms?: PlatformConfig[]
  obstacles?: ObstacleConfig[]
  collectibles?: Array<{ x: number; y: number; type: string }>
}

interface PlatformerChallengeProps {
  config: PlatformerConfig
  onAnswer: (result: { correct: boolean; score: number }) => void
}

interface EducationPopup {
  title: string
  message: string
  type: 'info' | 'warning' | 'success'
}

export function PlatformerChallenge({ config, onAnswer }: PlatformerChallengeProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameRef = useRef<any>(null)

  const [health, setHealth] = useState(100)
  const [score, setScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [gameState, setGameState] = useState<'playing' | 'completed' | 'gameover'>('playing')

  // Educational state
  const [collectedHandshake, setCollectedHandshake] = useState<HandshakeToken[]>([])
  const [collectedPacketParts, setCollectedPacketParts] = useState<PacketPart[]>([])
  const [educationPopup, setEducationPopup] = useState<EducationPopup | null>(null)
  const [handshakeComplete, setHandshakeComplete] = useState(false)
  const [packetAssembled, setPacketAssembled] = useState(false)

  // Handle game events
  const handleDamage = useCallback((data: { amount: number; source: string; explanation?: string }) => {
    setHealth((prev) => Math.max(0, prev - data.amount))
  }, [])

  const handleScore = useCallback((data: { points: number; reason: string }) => {
    setScore((prev) => prev + data.points)
  }, [])

  const handleLayerComplete = useCallback((data: { layer: string; score: number }) => {
    setGameState('completed')
    onAnswer({ correct: true, score: data.score })
  }, [onAnswer])

  const handlePlayerDied = useCallback(() => {
    setGameState('gameover')
    onAnswer({ correct: false, score })
  }, [onAnswer, score])

  const handlePause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const handleResume = useCallback(() => {
    setIsPaused(false)
    EventBus.emit('game:resume')
  }, [])

  // Educational event handlers
  const handleHandshakeCollected = useCallback((data: { token: HandshakeToken; collected: HandshakeToken[] }) => {
    setCollectedHandshake(data.collected)
  }, [])

  const handleHandshakeComplete = useCallback(() => {
    setHandshakeComplete(true)
  }, [])

  const handlePacketPart = useCallback((data: { part: PacketPart; collected: PacketPart[]; inOrder: boolean }) => {
    setCollectedPacketParts(data.collected)
  }, [])

  const handlePacketAssembled = useCallback(() => {
    setPacketAssembled(true)
  }, [])

  const handleEducationShow = useCallback((data: EducationPopup) => {
    setEducationPopup(data)
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setEducationPopup(null)
    }, 3000)
  }, [])

  const handleEducationHide = useCallback(() => {
    setEducationPopup(null)
  }, [])

  // Setup event listeners
  useEffect(() => {
    EventBus.on('player:damaged', handleDamage)
    EventBus.on('score:added', handleScore)
    EventBus.on('layer:completed', handleLayerComplete)
    EventBus.on('player:died', handlePlayerDied)
    EventBus.on('game:pause', handlePause)
    EventBus.on('handshake:collected', handleHandshakeCollected)
    EventBus.on('handshake:complete', handleHandshakeComplete)
    EventBus.on('packet:part', handlePacketPart)
    EventBus.on('packet:assembled', handlePacketAssembled)
    EventBus.on('education:show', handleEducationShow)
    EventBus.on('education:hide', handleEducationHide)

    return () => {
      EventBus.off('player:damaged', handleDamage)
      EventBus.off('score:added', handleScore)
      EventBus.off('layer:completed', handleLayerComplete)
      EventBus.off('player:died', handlePlayerDied)
      EventBus.off('game:pause', handlePause)
      EventBus.off('handshake:collected', handleHandshakeCollected)
      EventBus.off('handshake:complete', handleHandshakeComplete)
      EventBus.off('packet:part', handlePacketPart)
      EventBus.off('packet:assembled', handlePacketAssembled)
      EventBus.off('education:show', handleEducationShow)
      EventBus.off('education:hide', handleEducationHide)
    }
  }, [handleDamage, handleScore, handleLayerComplete, handlePlayerDied, handlePause, handleHandshakeCollected, handleHandshakeComplete, handlePacketPart, handlePacketAssembled, handleEducationShow, handleEducationHide])

  // Initialize Phaser game (dynamic import to avoid SSR issues)
  useEffect(() => {
    if (!gameContainerRef.current || gameRef.current) return

    const initGame = async () => {
      // Dynamic imports for browser-only Phaser
      const Phaser = (await import('phaser')).default
      const { createGameConfig } = await import('@/game/config')
      const { NetworkScene } = await import('@/game/scenes/NetworkScene')

      if (!gameContainerRef.current) return

      const gameConfig = createGameConfig(gameContainerRef.current)

      // Add NetworkScene
      gameConfig.scene = [NetworkScene]

      gameRef.current = new Phaser.Game(gameConfig)

      // Start scene with config
      gameRef.current.scene.start('NetworkScene', {
        quest: {
          id: 'platformer-challenge',
          name: 'Network Challenge',
          layers: [
            {
              type: 'NETWORK',
              challenge: {
                type: 'PLATFORMER',
                config,
              },
              order: 0,
            },
          ],
        },
        layerIndex: 0,
      })
    }

    initGame()

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [config])

  const handshakeTokens: HandshakeToken[] = ['SYN', 'SYN-ACK', 'ACK']
  const packetParts: PacketPart[] = ['header', 'payload', 'checksum']

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="flex items-start gap-3 mb-4">
        <Gamepad2 className="w-6 h-6 text-green-400 mt-1" />
        <div>
          <p className="text-lg text-white/90">
            Navigate through the network layer
          </p>
          <p className="text-sm text-white/60 mt-1">
            Use <kbd className="px-2 py-1 bg-white/10 rounded">Arrow Keys</kbd> to move and jump. Collect TCP tokens and assemble packets!
          </p>
        </div>
      </div>

      {/* HUD - Health and Score */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/30 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm">Health:</span>
          <div
            data-testid="health-bar"
            data-health={health}
            className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden"
          >
            <div
              className={cn(
                'h-full transition-all duration-300',
                health > 50 ? 'bg-green-500' : health > 25 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${health}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">Score:</span>
          <span data-testid="score-display" className="text-white font-bold">{score}</span>
        </div>
      </div>

      {/* Educational HUD - TCP Handshake Progress */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-blue-400" />
          <span className="text-white/80 text-sm font-medium">TCP Handshake:</span>
        </div>
        <div data-testid="handshake-progress" className="flex items-center gap-2">
          {handshakeTokens.map((token, index) => {
            const isCollected = collectedHandshake.includes(token)
            const isNext = !isCollected && (index === 0 || collectedHandshake.includes(handshakeTokens[index - 1]))
            return (
              <div key={token} className="flex items-center gap-1">
                <div
                  className={cn(
                    'px-2 py-1 rounded text-xs font-mono font-bold transition-all duration-300',
                    isCollected
                      ? 'bg-green-500 text-white'
                      : isNext
                        ? 'bg-blue-500/50 text-blue-200 animate-pulse'
                        : 'bg-gray-700 text-gray-400'
                  )}
                >
                  {token}
                </div>
                {index < handshakeTokens.length - 1 && (
                  <span className={cn(
                    'text-lg',
                    isCollected ? 'text-green-400' : 'text-gray-600'
                  )}>→</span>
                )}
              </div>
            )
          })}
          {handshakeComplete && (
            <CheckCircle className="w-5 h-5 text-green-400 ml-2" />
          )}
        </div>
      </div>

      {/* Educational HUD - Packet Assembly Progress */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-purple-400" />
          <span className="text-white/80 text-sm font-medium">Packet Assembly:</span>
        </div>
        <div data-testid="packet-progress" className="flex items-center gap-3">
          {packetParts.map((part) => {
            const isCollected = collectedPacketParts.includes(part)
            return (
              <div
                key={part}
                className={cn(
                  'px-3 py-1 rounded text-xs font-medium transition-all duration-300',
                  isCollected
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                )}
              >
                {part.charAt(0).toUpperCase() + part.slice(1)}
              </div>
            )
          })}
          {packetAssembled && (
            <Sparkles className="w-5 h-5 text-purple-400 ml-2" />
          )}
        </div>
      </div>

      {/* Game Container */}
      <div className="relative">
        <div
          data-testid="platformer-game"
          ref={gameContainerRef}
          className="w-full rounded-lg overflow-hidden border-2 border-green-500/30"
          style={{
            aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
            maxHeight: '500px'
          }}
        />

        {/* Educational Popup Overlay */}
        {educationPopup && gameState === 'playing' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
            <div className={cn(
              'px-4 py-3 rounded-lg shadow-lg flex items-start gap-3',
              educationPopup.type === 'info' && 'bg-blue-900/95 border border-blue-500/50',
              educationPopup.type === 'warning' && 'bg-orange-900/95 border border-orange-500/50',
              educationPopup.type === 'success' && 'bg-green-900/95 border border-green-500/50'
            )}>
              {educationPopup.type === 'info' && <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}
              {educationPopup.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />}
              {educationPopup.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold text-white text-sm">{educationPopup.title}</p>
                <p className="text-white/80 text-xs mt-1">{educationPopup.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && gameState === 'playing' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-4">Paused</p>
              <button
                onClick={handleResume}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
              >
                Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Completion Overlay */}
      {gameState === 'completed' && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="font-semibold text-green-400">Network Layer Completed!</span>
          </div>
          <p className="text-white/70 text-sm mt-2">
            Final Score: {score} points
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-white/60">
              <Network className="w-4 h-4" />
              <span>TCP Handshake: {handshakeComplete ? 'Complete' : 'Incomplete'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Package className="w-4 h-4" />
              <span>Packets Assembled: {packetAssembled ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'gameover' && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-400" />
            <span className="font-semibold text-red-400">Game Over</span>
          </div>
          <p className="text-white/70 text-sm mt-2">
            Score: {score} points
          </p>
        </div>
      )}
    </div>
  )
}
