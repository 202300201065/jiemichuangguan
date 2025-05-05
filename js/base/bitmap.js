export default class Bitmap {
  constructor(image) {
    this.image = image
    this.width = image.width || 0
    this.height = image.height || 0
  }

  draw(context, x, y, width, height) {
    if (!this.image || this.width === 0) return
    context.drawImage(
      this.image,
      x,
      y,
      width || this.width,
      height || this.height
    )
  }
}