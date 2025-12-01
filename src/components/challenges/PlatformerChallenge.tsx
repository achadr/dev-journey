'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { EventBus } from '@/game/EventBus'
import { CheckCircle, XCircle, Gamepad2, Target, Info, AlertTriangle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// Game dimensions (must match config)
const GAME_WIDTH = 1280
const GAME_HEIGHT = 720

interface PlatformerConfig {
  levelLength?: number
  obstacles?: number
  speed?: number
  obstacleTypes?: string[]
  theme?: string
}

interface PlatformerChallengeProps {
  config: PlatformerConfig
  onAnswer: (result: { correct: boolean; score: number }) => void
}

interface EducationPopup {
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
}

interface ThemeInfo {
  theme: string
  themeConfig: {
    name: string
    description: string
    collectibles: Array<{ id: string; label: string }>
  }
  collectibles: Array<{ id: string; label: string; order: number }>
}

export function PlatformerChallenge({ config, onAnswer }: PlatformerChallengeProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameRef = useRef<any>(null)
  const educationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [health, setHealth] = useState(100)
  const [score, setScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [gameState, setGameState] = useState<'playing' | 'completed' | 'gameover'>('playing')

  // Theme-based state
  const [themeInfo, setThemeInfo] = useState<ThemeInfo | null>(null)
  const [collectedIds, setCollectedIds] = useState<string[]>([])
  const [allCollected, setAllCollected] = useState(false)
  const [educationPopup, setEducationPopup] = useState<EducationPopup | null>(null)

  // Handle game events
  const handleDamage = useCallback((data: { amount: number; source: string }) => {
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

  // Theme-based event handlers
  const handleThemeInit = useCallback((data: ThemeInfo) => {
    setThemeInfo(data)
    setCollectedIds([])
    setAllCollected(false)
  }, [])

  const handleCollectibleCollected = useCallback((data: { id: string; collected: string[] }) => {
    setCollectedIds(data.collected)
  }, [])

  const handleCollectiblesComplete = useCallback(() => {
    setAllCollected(true)
  }, [])

  const handleEducationShow = useCallback((data: EducationPopup) => {
    if (educationTimeoutRef.current) {
      clearTimeout(educationTimeoutRef.current)
    }
    setEducationPopup(data)
    educationTimeoutRef.current = setTimeout(() => {
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
    EventBus.on('theme:init', handleThemeInit)
    EventBus.on('collectible:collected', handleCollectibleCollected)
    EventBus.on('collectibles:complete', handleCollectiblesComplete)
    EventBus.on('education:show', handleEducationShow)
    EventBus.on('education:hide', handleEducationHide)

    return () => {
      EventBus.off('player:damaged', handleDamage)
      EventBus.off('score:added', handleScore)
      EventBus.off('layer:completed', handleLayerComplete)
      EventBus.off('player:died', handlePlayerDied)
      EventBus.off('game:pause', handlePause)
      EventBus.off('theme:init', handleThemeInit)
      EventBus.off('collectible:collected', handleCollectibleCollected)
      EventBus.off('collectibles:complete', handleCollectiblesComplete)
      EventBus.off('education:show', handleEducationShow)
      EventBus.off('education:hide', handleEducationHide)
      // Clear education timeout on unmount
      if (educationTimeoutRef.current) {
        clearTimeout(educationTimeoutRef.current)
      }
    }
  }, [handleDamage, handleScore, handleLayerComplete, handlePlayerDied, handlePause, handleThemeInit, handleCollectibleCollected, handleCollectiblesComplete, handleEducationShow, handleEducationHide])

  // Initialize Phaser game (dynamic import to avoid SSR issues)
  useEffect(() => {
    if (!gameContainerRef.current) return

    // Prevent double initialization in React Strict Mode
    let isInitialized = false

    const initGame = async () => {
      // Check again after async import
      if (isInitialized || gameRef.current) return

      const Phaser = (await import('phaser')).default
      const { createGameConfig } = await import('@/game/config')
      const { NetworkScene } = await import('@/game/scenes/NetworkScene')

      // Check again after async operations
      if (isInitialized || gameRef.current || !gameContainerRef.current) return

      isInitialized = true

      const gameConfig = createGameConfig(gameContainerRef.current)

      // Add NetworkScene to config - Phaser will auto-start first scene
      gameConfig.scene = [NetworkScene]

      const sceneData = {
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
      }

      gameRef.current = new Phaser.Game(gameConfig)

      // Wait for game to be ready, then restart scene with data
      gameRef.current.events.once('ready', () => {
        if (gameRef.current?.scene.getScene('NetworkScene')) {
          gameRef.current.scene.start('NetworkScene', sceneData)
        }
      })
    }

    initGame()

    return () => {
      isInitialized = true // Prevent initialization if cleanup happens during async
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [config])

  // Get theme-specific colors
  const getThemeColors = (theme: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      tcp: { bg: 'bg-blue-900/30', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' },
      http: { bg: 'bg-orange-900/30', border: 'border-orange-500/30', text: 'text-orange-400', icon: 'text-orange-400' },
      auth: { bg: 'bg-yellow-900/30', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: 'text-yellow-400' },
      api: { bg: 'bg-pink-900/30', border: 'border-pink-500/30', text: 'text-pink-400', icon: 'text-pink-400' },
      none: { bg: 'bg-gray-900/30', border: 'border-gray-500/30', text: 'text-gray-400', icon: 'text-gray-400' },
    }
    return colors[theme] || colors.none
  }

  const themeColors = themeInfo ? getThemeColors(themeInfo.theme) : getThemeColors('none')
  const hasCollectibles = themeInfo && themeInfo.collectibles.length > 0

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
            Use <kbd className="px-2 py-1 bg-white/10 rounded">Arrow Keys</kbd> to move and jump.
            {hasCollectibles && ` Collect ${themeInfo?.themeConfig.name} items!`}
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

      {/* Theme-based Progress HUD */}
      {hasCollectibles && (
        <div className={cn('flex items-center justify-between px-4 py-3 rounded-lg border', themeColors.bg, themeColors.border)}>
          <div className="flex items-center gap-3">
            <Target className={cn('w-5 h-5', themeColors.icon)} />
            <span className={cn('text-sm font-medium', themeColors.text)}>
              {themeInfo?.themeConfig.name}:
            </span>
          </div>
          <div data-testid="collectible-progress" className="flex items-center gap-2">
            {themeInfo?.collectibles.map((item, index) => {
              const isCollected = collectedIds.includes(item.id)
              const isNext = !isCollected && index === collectedIds.length
              return (
                <div key={item.id} className="flex items-center gap-1">
                  <div
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium transition-all duration-300',
                      isCollected
                        ? 'bg-green-500 text-white'
                        : isNext
                          ? 'bg-white/20 text-white animate-pulse'
                          : 'bg-gray-700 text-gray-400'
                    )}
                  >
                    {item.label}
                  </div>
                  {index < (themeInfo?.collectibles.length || 0) - 1 && (
                    <span className={cn(
                      'text-lg',
                      isCollected ? 'text-green-400' : 'text-gray-600'
                    )}>→</span>
                  )}
                </div>
              )
            })}
            {allCollected && (
              <Sparkles className="w-5 h-5 text-green-400 ml-2" />
            )}
          </div>
        </div>
      )}

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
          {hasCollectibles && (
            <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
              <Target className="w-4 h-4" />
              <span>{themeInfo?.themeConfig.name}: {allCollected ? 'Complete!' : `${collectedIds.length}/${themeInfo?.collectibles.length}`}</span>
            </div>
          )}
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
