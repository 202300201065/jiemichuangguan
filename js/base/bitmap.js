export default class Bitmap {
  constructor(image) {
    this.image = image
    this.width = image.width || 0
    this.height = image.height || 0
  }
  
  draw(context, x, y, width, height) {
    if (!this.image || this.width === 0 || this.height === 0) return
    
    try {
      context.drawImage(
        this.image,
        x,
        y,
        width || this.width,
        height || this.height
      )
    } catch (e) {
      console.error('绘制图片失败:', e)
    }
  }
}