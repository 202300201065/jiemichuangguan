import Sprite from './base/sprite'

export default class Player extends Sprite {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, 40, 60)
    this.speed = 4
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
  }

  update(direction, force) {
    if (!direction || force < 0.1) return

    const moveSpeed = this.speed * force
    this.x += Math.cos(direction) * moveSpeed
    this.y += Math.sin(direction) * moveSpeed

    // 边界约束
    this.x = Math.max(20, Math.min(this.canvasWidth - 20, this.x))
    this.y = Math.max(30, Math.min(this.canvasHeight - 30, this.y))
  }
}