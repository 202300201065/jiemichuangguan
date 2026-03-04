// 修改safe.js
export default class Safe {
  constructor(worldX, worldY) {  // 使用世界坐标
    this.worldX = worldX;  // 场景中的绝对X坐标
    this.worldY = worldY;  // 场景中的绝对Y坐标
    this.isVisible = true;
    this.size = 150;  // 统一尺寸
  }

  draw(ctx, sceneOffsetX) {
    const screenX = this.worldX + sceneOffsetX;
    ctx.drawImage(
      this.img.image,
      screenX - this.size/2,
      this.worldY - this.size/2,
      this.size*2,
      this.size
    );
  }
}