import Phaser from 'phaser'

interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

interface Circle {
  x: number
  y: number
  radius: number
}

interface Point {
  x: number
  y: number
}

export class CollisionSystem {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * Setup collision detection between player and obstacles
   */
  setup(
    player: Phaser.Physics.Arcade.Sprite,
    obstacles: Phaser.Physics.Arcade.Group,
    onCollision: (obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody) => void
  ): void {
    this.scene.physics.add.overlap(
      player,
      obstacles,
      (_, obstacle) => {
        onCollision(obstacle as Phaser.Types.Physics.Arcade.GameObjectWithBody)
      },
      undefined,
      this.scene
    )
  }

  /**
   * Check AABB collision between two rectangles
   * Returns true if rectangles overlap (not just touching)
   * Zero-size rectangles cannot collide
   */
  static checkAABB(a: Rectangle, b: Rectangle): boolean {
    // Zero-size rectangles cannot collide
    if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) {
      return false
    }
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    )
  }

  /**
   * Check circle collision between two circles
   * Returns true if circles overlap (not just touching)
   */
  static checkCircle(a: Circle, b: Circle): boolean {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < a.radius + b.radius
  }

  /**
   * Check if a point is inside a rectangle
   * Inclusive on left/top edges, exclusive on right/bottom edges
   */
  static checkPointInRect(point: Point, rect: Rectangle): boolean {
    return (
      point.x >= rect.x &&
      point.x < rect.x + rect.width &&
      point.y >= rect.y &&
      point.y < rect.y + rect.height
    )
  }

  /**
   * Check if a point is inside a circle
   * Returns false if point is on edge
   */
  static checkPointInCircle(point: Point, circle: Circle): boolean {
    const dx = point.x - circle.x
    const dy = point.y - circle.y
    const distanceSquared = dx * dx + dy * dy
    return distanceSquared < circle.radius * circle.radius
  }
}
