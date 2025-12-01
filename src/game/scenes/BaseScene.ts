import Phaser from 'phaser'
import { EventBus } from '../EventBus'

export interface LayerConfig {
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
  layers: LayerConfig[]
}

export interface SceneData {
  quest: Quest
  layerIndex: number
}

export abstract class BaseScene extends Phaser.Scene {
  protected quest!: Quest
  protected layerConfig!: LayerConfig
  protected playerHealth: number = 100

  init(data?: SceneData): void {
    // Handle case when scene is auto-started without data (will be restarted with data)
    if (!data?.quest) {
      return
    }
    this.quest = data.quest
    this.layerConfig = data.quest.layers[data.layerIndex]
  }

  create(): void {
    // Common setup for all scenes
    this.setupPauseHandler()
    this.setupCommonUI()
  }

  private setupPauseHandler(): void {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause()
      EventBus.emit('game:pause')
    })

    EventBus.on('game:resume', () => {
      this.scene.resume()
    })
  }

  private setupCommonUI(): void {
    // Override in child classes if needed
  }

  protected emitDamage(amount: number, source: string): void {
    this.playerHealth -= amount
    EventBus.emit('player:damaged', { amount, source })

    if (this.playerHealth <= 0) {
      this.handlePlayerDeath()
    }
  }

  protected emitScore(points: number, reason: string): void {
    EventBus.emit('score:added', { points, reason })
  }

  protected handlePlayerDeath(): void {
    EventBus.emit('player:died')
    this.scene.start('GameOverScene', { quest: this.quest })
  }

  protected completeLayer(score: number): void {
    EventBus.emit('layer:completed', {
      layer: this.layerConfig.type,
      score,
    })

    // Progress to next layer or victory
    const currentIndex = this.quest.layers.indexOf(this.layerConfig)
    const nextIndex = currentIndex + 1

    if (nextIndex < this.quest.layers.length) {
      const nextLayer = this.quest.layers[nextIndex]
      this.scene.start(this.getSceneKey(nextLayer.type), {
        quest: this.quest,
        layerIndex: nextIndex,
      })
    } else {
      this.scene.start('VictoryScene', { quest: this.quest })
    }
  }

  private getSceneKey(layerType: string): string {
    const sceneMap: Record<string, string> = {
      BROWSER: 'BrowserLayer',
      NETWORK: 'NetworkLayer',
      API: 'APILayer',
      DATABASE: 'DatabaseLayer',
    }
    return sceneMap[layerType] || 'BrowserLayer'
  }
}
