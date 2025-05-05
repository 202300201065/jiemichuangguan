import Sprite from './base/sprite'

export default class Joystick extends Sprite {
  constructor(x, y) {
    super(x, y, 120, 120)
    this.knobX = x
    this.knobY = y
    this.knobSize = 40
    this.direction = 0
    this.force = 0
    this.isActive = false
    this.maxRadius = 50
  }

  handleTouchStart(x, y) {
    const distance = Math.sqrt((x - this.x)**2 + (y - this.y)**2)
    if (distance <= this.width/2) {
      this.isActive = true
      this.updatePosition(x, y)
    }
  }

  updatePosition(x, y) {
    const dx = x - this.x
    const dy = y - this.y
    const distance = Math.sqrt(dx**2 + dy**2)
    
    this.direction = Math.atan2(dy, dx)
    this.force = Math.min(distance / this.maxRadius, 1)
    
    if (distance > this.maxRadius) {
      this.knobX = this.x + (dx / distance) * this.maxRadius
      this.knobY = this.y + (dy / distance) * this.maxRadius
    } else {
      this.knobX = x
      this.knobY = y
    }
  }

  draw(context) {
    if (!this.visible) return
    
    // 绘制底座
    context.fillStyle = 'rgba(0, 0, 0, 0.3)'
    context.beginPath()
    context.arc(this.x, this.y, this.width/2, 0, Math.PI*2)
    context.fill()

    // 绘制摇杆
    context.fillStyle = 'rgba(255, 255, 255, 0.8)'
    context.beginPath()
    context.arc(this.knobX, this.knobY, this.knobSize/2, 0, Math.PI*2)
    context.fill()
  }
}