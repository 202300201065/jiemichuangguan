export default class Player {
  constructor(worldX, worldY, worldWidth, worldHeight) {
    this.worldX = worldX;
    this.worldY = worldY;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.size = 60; // 角色尺寸
    this.speed = 3;
    this.img = null; // 角色图片
    
    // 跳跃相关属性
    this.isJumping = false;
    this.velocityY = 0;
    this.gravity = 0.5;
    this.jumpPower = 0;
    this.isCharging = false;
    this.jumpChargeStart = 0;
  }

  // 跳跃方法
  jump(power) {
    if (!this.isJumping) {
      this.isJumping = true;
      this.velocityY = -power;
    }
  }

  // 开始蓄力
  startCharge() {
    if (!this.isJumping && !this.isCharging) {
      this.isCharging = true;
      this.jumpChargeStart = Date.now();
    }
  }

  // 结束蓄力并跳跃
  endCharge() {
    if (this.isCharging && !this.isJumping) {
      this.isCharging = false;
      this.jumpPower = Math.min(20, (Date.now() - this.jumpChargeStart) / 20);
      this.jump(this.jumpPower);
    }
  }

  // 更新物理状态（用于第三关）
  updatePhysics() {
    if (this.isJumping) {
      this.worldY += this.velocityY;
      this.velocityY += this.gravity;
      
      // 地面检测
      if (this.worldY >= this.worldHeight - this.size) {
        this.worldY = this.worldHeight - this.size;
        this.isJumping = false;
        this.velocityY = 0;
      }
    }
    
    // 更新蓄力值
    if (this.isCharging) {
      this.jumpPower = Math.min(20, (Date.now() - this.jumpChargeStart) / 20);
    }
  }

  // 更新位置（用于第一关和第二关）
  update(direction) {
    if (direction) {
      this.worldX += direction.x * this.speed;
      this.worldY += direction.y * this.speed;
    }
    
    // 边界检查
    this.worldX = Math.max(
      0,
      Math.min(
        this.worldWidth - this.size,
        this.worldX
      )
    );
    
    this.worldY = Math.max(
      0,
      Math.min(
        this.worldHeight - this.size,
        this.worldY
      )
    );
  }

  // 碰撞检测
  checkCollision(target) {
    return (
      this.worldX < target.worldX + target.size &&
      this.worldX + this.size > target.worldX &&
      this.worldY < target.worldY + target.size &&
      this.size + this.worldY > target.worldY
    );
  }

  // 重置位置
  reset(x, y) {
    this.worldX = x;
    this.worldY = y;
    // 重置跳跃状态
    this.isJumping = false;
    this.velocityY = 0;
    this.isCharging = false;
    this.jumpPower = 0;
  }

  draw(ctx, sceneOffsetX) {
    const screenX = this.worldX + sceneOffsetX;
    if (this.img) {
      ctx.drawImage(
        this.img.image,
        screenX,
        this.worldY,
        this.size,
        this.size
      );
    } else {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(
        screenX,
        this.worldY,
        this.size,
        this.size
      );
    }
  }
}