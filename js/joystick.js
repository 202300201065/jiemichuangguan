// 在js/joystick.js中
export default class Joystick {
  constructor(baseX, baseY) {
    this.baseX = baseX;
    this.baseY = baseY;
    this.stickX = baseX;
    this.stickY = baseY;
    this.isActive = false;
    this.maxDistance = 40;
  }

  handleTouchStart(x, y) {
    this.isActive = true;
    this.handleTouchMove(x, y);
  }

  handleTouchMove(x, y) {
    const deltaX = x - this.baseX;
    const deltaY = y - this.baseY;
    const distance = Math.sqrt(deltaX**2 + deltaY**2);

    if (distance > this.maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      this.stickX = this.baseX + Math.cos(angle) * this.maxDistance;
      this.stickY = this.baseY + Math.sin(angle) * this.maxDistance;
    } else {
      this.stickX = x;
      this.stickY = y;
    }
  }

  handleTouchEnd() {
    this.isActive = false;
    this.stickX = this.baseX;
    this.stickY = this.baseY;
  }

  // 在Joystick类中优化getDirection方法
getDirection() {
  const deadZone = 5; // 5像素内的移动视为无效
  if (Math.abs(this.stickX - this.baseX) < deadZone && 
      Math.abs(this.stickY - this.baseY) < deadZone) {
    return { x: 0, y: 0 };
  }
  const deltaX = this.stickX - this.baseX;
  const deltaY = this.stickY - this.baseY;
  const magnitude = Math.sqrt(deltaX ** 2 + deltaY ** 2) || 1; // 避免除以零
  
  return {
    x: deltaX / magnitude,
    y: deltaY / magnitude
  };
}
draw(ctx) {
  // 绘制摇杆基底
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(this.baseX, this.baseY, 30, 0, Math.PI * 2);
  ctx.fill();

   // 摇杆手柄
   ctx.fillStyle = this.isActive ? '#666' : '#999';
   ctx.beginPath();
   ctx.arc(this.stickX, this.stickY, 15, 0, Math.PI * 2);
   ctx.fill();
 }

 // 在Joystick类中添加
reset() {
  this.isActive = false;
  this.stickX = this.baseX;
  this.stickY = this.baseY;
}
}