export default class Sprite {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.visible = true
  }
  
  draw(context) {
    if (!this.visible || !this.img) return
    
    this.img.draw(
      context,
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    )
  }
}