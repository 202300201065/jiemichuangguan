import Sprite from './base/sprite'

export default class InteractiveObject extends Sprite {
  constructor(x, y, width, height, text) {
    super(x, y, width, height)
    this.text = text
    this.canInteract = false
    this.isShowingText = false
    this.textDuration = 2000
    this.textTimer = null
  }

  checkInteraction(player) {
    const distance = Math.sqrt(
      Math.pow(player.x - this.x, 2) + 
      Math.pow(player.y - this.y, 2)
    )
    this.canInteract = distance < 150
    return this.canInteract
  }

  showText(context, canvasWidth) {
    if (!this.canInteract || !this.text) return
    
    // 文本背景
    context.fillStyle = 'rgba(0, 0, 0, 0.8)'
    const textWidth = context.measureText(this.text).width + 20
    context.fillRect(
      canvasWidth/2 - textWidth/2,
      this.y - 100,
      textWidth,
      40
    )

    // 文本内容
    context.fillStyle = '#fff'
    context.font = '16px Arial'
    context.textAlign = 'center'
    context.fillText(this.text, canvasWidth/2, this.y - 80)

    this.isShowingText = true
    clearTimeout(this.textTimer)
    this.textTimer = setTimeout(() => {
      this.isShowingText = false
    }, this.textDuration)
  }
}