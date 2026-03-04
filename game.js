import Main from './js/runtime' 
import Player from './js/player' 
import Joystick from './js/joystick' 
import Door from './js/objects/door' 
import TrashBin from './js/objects/trashbin' 
import Safe from './js/objects/safe' 
import Table from './js/objects/table'
import Music from './js/music'; // 导入音乐类
GameGlobal.musicManager = new Music(); // 全局音乐管理实例
const GameState = {
 MENU: 0, 
 PLAYING: 1, 
 OVER: 2,
 LEVEL_COMPLETE: 3, // 新增关卡完成状态
 LEVEL_2: 4,         // 新增第二关状态
 LEVEL_3: 5,         // 新增第三关状态
 WELCOME: 6
}; 

// 第二关常量
const ENEMY_GENERATE_INTERVAL = 30; // 敌机生成间隔（帧数）
const BULLET_SPEED = 10;           // 子弹速度
const PLAYER_SPEED_LEVEL2 = 5;     // 第二关玩家移动速度
// 子弹类
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 20;
    this.speed = BULLET_SPEED;
    this.active = true;
  }

  update() {
    this.y -= this.speed;
    // 如果子弹飞出屏幕，标记为非活动状态
    if (this.y < -this.height) {
      this.active = false;
    }
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  // 检测与敌机的碰撞
  isCollideWith(enemy) {
    return this.active && enemy.active &&
      this.x < enemy.x + enemy.width &&
      this.x + this.width > enemy.x &&
      this.y < enemy.y + enemy.height &&
      this.y + this.height > enemy.y;
  }
}

// 敌机类
class Enemy {
  constructor(windowWidth, windowHeight,img) {
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;
    this.width = 60;
    this.height = 150;
    this.x = 0;
    this.y = 0;
    this.speed = 2;
    this.active = true;
    this.img = img; // 敌机图片
  }

  init() {
    this.active = true;
    this.x = Math.random() * (this.windowWidth - this.width);
    this.y = -this.height;
  }

  update() {
    this.y += this.speed;
    // 如果敌机飞出屏幕底部，标记为非活动状态
    if (this.y > this.windowHeight) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    // 使用图片绘制敌机
    if (this.img) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    } else {
      // 如果没有图片，使用绿色方块作为备选
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  // 检测与玩家的碰撞
  isCollideWith(player) {
    return this.active &&
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y;
  }
}

// 玩家飞机类（第二关专用）
class PlayerPlane {
  constructor(windowWidth, windowHeight, img) {
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;
    this.width = 60; // 使用第一关角色尺寸
    this.height = 60;
    this.x = windowWidth / 2 - this.width / 2;
    this.y = windowHeight - this.height - 20;
    this.speed = PLAYER_SPEED_LEVEL2;
    this.active = true;
    this.bullets = [];
    this.lastShotTime = 0;
    this.shootInterval = 300; // 射击间隔（毫秒）
    this.img = img; // 保存角色图片
  }

  update(direction) {
    // 根据方向移动
    if (direction) {
      this.x += direction.x * this.speed;
      this.y += direction.y * this.speed;
    }
    
    // 边界检查
    this.x = Math.max(0, Math.min(this.windowWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(this.windowHeight - this.height, this.y));
    
    // 更新子弹
    this.bullets.forEach(bullet => bullet.update());
    // 移除非活动的子弹
    this.bullets = this.bullets.filter(bullet => bullet.active);
  }

  shoot() {
    const currentTime = Date.now();
    if (currentTime - this.lastShotTime > this.shootInterval) {
      this.bullets.push(new Bullet(
        this.x + this.width / 2 - 5, 
        this.y
      ));
      this.lastShotTime = currentTime;
      return true;
    }
    return false;
  }

  draw(ctx) {
    // 使用第一关的角色图片绘制
    if (this.img) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    } else {
      // 如果没有图片，使用蓝色方块作为备选
      ctx.fillStyle = '#0000FF';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    // 绘制子弹
    this.bullets.forEach(bullet => bullet.draw(ctx));
  }
}

export default class Game {
 constructor() {
  this.backgrounds = {
    tileWidth: 0,  // 初始默认值
    tiles: [],
    images: ['background1', 'background2', 'background3'],
    level2Images: ['background4', 'background5', 'background6'] // 第二关背景
  };
  // 添加菜单按钮配置
  this.menuButton = {
    x: 20, // 屏幕左上角
    y: 20,
    width: 80,
    height: 40,
    text: '菜单',
    color: '#3498db',
    isPressed: false
  };
  // 添加第三关属性
  this.platforms = []; // 平台数组
  this.jumpPower = 0;  // 跳跃蓄力
  this.isCharging = false; // 是否正在蓄力
  this.jumpChargeStart = 0; // 蓄力开始时间
  this.gravity = 0.5; // 重力
  this.velocityY = 0; // Y轴速度
  this.isJumping = false; // 是否跳跃中
  this.currentPlatformIndex = 0; // 当前所在平台索引
  this.level3Score = 0; // 第三关分数
  this.level3Progress = 0; // 第三关进度
  this.level3Target = 10; // 需要跳跃的平台数量
  this.level3State = 'ready'; // 状态: ready, charging, jumping, landed, failed
  this.jumpDirectionX = 0; // 修复：添加跳跃方向变量
  this.gameState = GameState.MENU; 
  this.scene = {
    width: 2000,      // 场景总宽度
    offsetX: 0,       // 场景偏移量
    minOffset: 0,
    maxOffset: 0
    };
    // 获取窗口信息并保存
    this.windowInfo = wx.getWindowInfo();
    // 添加F按钮配置
  this.fButton = {
    x: 0,
    y: 0,
    size: 60,
    isPressed: false,
    opacity: 0.7
  };

  this.showTrashMessage = false;
  this.showSafeMessage = false;
  this.showTableMessage = false;
  this.showDoorMessage = false;
  this.isGameCompleted = false;
  this.messageIndex1 = 0;
  this.messageIndex2 = 0;
  this.messageIndex3 = 0;
  this.messageIndex4 = 0;
  this.messageSets = {
    trash: [
      '垃圾桶已满',
      '这是一个垃圾桶',
      '垃圾桶已满',
      '需要清理了',
      '这是一个垃圾桶',
      '你发现了一把钥匙'
    ],
    safe: [
      '请输入密码',
      '这是一个保险箱',
      '请输入密码',
      '保险箱已打开',
      '你得到了一把钥匙'
    ],
    table: [
      '桌子上有一张纸',
      '桌子上有一张纸',
      '纸上写着：3.1415926'
    ],
    door: [
      '需要找到钥匙开门',
      '门好像锁住了',
      '需要找到钥匙开门',
      '门好像锁住了',
      '去找找钥匙吧',
      '门没关'
    ]
  };
  // 设置F按钮位置（屏幕右下角）
  this.fButton.x = this.windowInfo.windowWidth - 80;
  this.fButton.y = this.windowInfo.windowHeight - 90;
  // 场景边界计算
  this.scene.maxOffset = Math.min(0, this.windowInfo.windowWidth - this.scene.width);
  this.scene.minOffset = 0; // 最小不能超过右侧边界
  this.initCoreComponents(); 
  this.initGameObjects(); 
  this.initEventListeners(); 
  this.preloadResources(); 
  this.completeTimer = null; // 添加计时器变量
  this.currentLevel = 1; // 当前关卡
  this.levelCompleteTimer = null; // 关卡完成计时器

  // 启动游戏循环
  this.gameLoop();
 }

 initCoreComponents() {
 this.canvas = wx.createCanvas(); 
 this.ctx = this.canvas.getContext('2d'); 
 const windowInfo = wx.getWindowInfo()
 this.scene.maxOffset = Math.min(0, windowInfo.windowWidth - this.scene.width);
 this.windowInfo = windowInfo
 this.main = new Main(); 
 this.systemSetting = wx.getSystemSetting();
// 初始化场景总宽度为3倍背景图宽度（可根据需要调整）
const bgImg = this.main.imageMap.get('background1');
this.backgrounds.tileWidth = bgImg ? bgImg.image.width : 750;
this.scene.width = this.backgrounds.tileWidth * 3;
 // 开始按钮配置 
 this.startButton = { 
 x: this.windowInfo.windowWidth/2 - 100, 
 y: this.windowInfo.windowHeight/2 - 40, 
 width: 200, 
 height: 80, 
 text: '开始游戏', 
 color: '#FF9900', 
 isPressed: false 
 }; 
  // 设置菜单按钮位置
  this.menuButton.x = 20;
  this.menuButton.y = 20;
  // 设置F按钮位置（屏幕右下角）
  this.fButton.x = this.windowInfo.windowWidth - 80;
  this.fButton.y = this.windowInfo.windowHeight - 90;
  this.scene.minOffset = 0; // 最小不能超过右侧边界
 } 

 initGameObjects() {
  this.player = new Player(
    this.windowInfo.windowWidth / 2,
    this.windowInfo.windowHeight / 2,
    this.scene.width,  // 使用场景宽度作为世界边界
    this.windowInfo.windowHeight
  );
  
  this.joystick = new Joystick(100, this.windowInfo.windowHeight - 90);
  this.door = new Door(3500, this.windowInfo.windowHeight - 212);
  this.trashBin = new TrashBin(1000, this.windowInfo.windowHeight - 120);
  this.safe = new Safe(2000, this.windowInfo.windowHeight - 120);
  this.table = new Table(1500, this.windowInfo.windowHeight - 150);
}

initEventListeners() {
  wx.onTouchStart(this.handleTouchStart.bind(this));
  wx.onTouchMove(this.handleTouchMove.bind(this));
  wx.onTouchEnd(this.handleTouchEnd.bind(this));
  wx.onKeyDown(this.handleKeyDown.bind(this));
}

// 初始化第三关
initLevel3() {
  this.platforms = [];
  this.jumpPower = 0;
  this.isCharging = false;
  this.velocityY = 0;
  this.isJumping = false;
  this.currentPlatformIndex = 0;
  this.level3Score = 0;
  this.level3Progress = 0;
  this.level3State = 'ready';
  this.scene.offsetX = 0; // 确保第三关没有横向滚动
  
  // 创建初始平台
  const startPlatform = {
    x: this.windowInfo.windowWidth / 2 - 50,
    y: this.windowInfo.windowHeight - 100,
    width: 100,
    height: 20,
    color: '#3498db',
    type: 'start'
  };
  
  this.platforms.push(startPlatform);
  
  // 创建目标平台
  for (let i = 0; i < this.level3Target; i++) {
    const prevPlatform = this.platforms[this.platforms.length - 1];
    
    // 计算新平台位置
    const direction = Math.random() > 0.5 ? 1 : -1;
    const distance = 80 + Math.random() * 120;
    const heightDiff = -80 - Math.random() * 50;
    
    const newX = prevPlatform.x + distance * direction;
    const newY = prevPlatform.y + heightDiff;
    
    // 确保平台不会超出屏幕
    const minX = 20;
    const maxX = this.windowInfo.windowWidth - 80;
    const clampedX = Math.max(minX, Math.min(maxX, newX));
    
    const platform = {
      x: clampedX,
      y: newY,
      width: 60 + Math.random() * 80,
      height: 15,
      color: i === this.level3Target - 1 ? '#e74c3c' : '#2ecc71',
      type: i === this.level3Target - 1 ? 'end' : 'normal'
    };
    
    this.platforms.push(platform);
  }
  
  // 设置玩家位置在起始平台
  this.player.worldX = startPlatform.x + startPlatform.width / 2 - this.player.size / 2;
  this.player.worldY = startPlatform.y - this.player.size;
}
checkPlatformCollision() {
  const playerBottom = this.player.worldY + this.player.size;
  const playerRight = this.player.worldX + this.player.size;
  
  for (let i = 0; i < this.platforms.length; i++) {
    // 跳过当前平台
    if (i === this.currentPlatformIndex) continue;
    
    const platform = this.platforms[i];
    const platformTop = platform.y;
    const platformBottom = platform.y + platform.height;
    const platformLeft = platform.x;
    const platformRight = platform.x + platform.width;
    
    // 检查是否落在平台上
    const isFalling = this.velocityY > 0;
    const isAbovePlatform = playerBottom <= platformTop;
    const isLanding = isFalling && 
      playerBottom + this.velocityY >= platformTop && 
      playerBottom <= platformBottom &&
      this.player.worldX < platformRight &&
      playerRight > platformLeft;
    
    if (isLanding) {
      // 着陆处理
      this.isJumping = false;
      this.velocityY = 0;
      this.player.worldY = platformTop - this.player.size;
      this.currentPlatformIndex = i;
      this.level3State = 'landed';
      
      // 更新进度
      if (i > this.level3Progress) {
        this.level3Score += 10;
        this.level3Progress = i;
      }
      
      // 到达终点
      if (platform.type === 'end') {
        this.level3State = 'completed';
        setTimeout(() => {
          this.gameState = GameState.OVER;
        }, 1000);
      }
      
      // 播放音效
      GameGlobal.musicManager.playSound('land');
      return true;
    }
  }
  return false;
}

handleInteraction() {
  if (this.gameState === GameState.PLAYING){
    // 第一关的交互逻辑
    if (this.trashBin.canInteract) {
      this.showTrashMessage = true;
      this.showSafeMessage = false;
      this.showTableMessage = false;
      this.showDoorMessage = false;
      this.messageIndex1 = (this.messageIndex1 + 1) % this.messageSets.trash.length;
      setTimeout(() => this.showTrashMessage = false, 2000);
    }
    if (this.safe.canInteract) {
      this.showSafeMessage = true;
      this.showTrashMessage = false;
      this.showTableMessage = false;
      this.showDoorMessage = false;
      this.messageIndex3 = (this.messageIndex3 + 1) % this.messageSets.safe.length;
      setTimeout(() => this.showSafeMessage = false, 2000);
    }
    if (this.table.canInteract) {
      this.showTableMessage = true;
      this.showSafeMessage = false;
      this.showTrashMessage = false;
      this.showDoorMessage = false;
      this.messageIndex4 = (this.messageIndex4 + 1) % this.messageSets.table.length;
      setTimeout(() => this.showSafeMessage = false, 2000);
    }
    if (this.door.canInteract) {
      this.showDoorMessage = true;
      this.showTrashMessage = false;
      this.showSafeMessage = false;
      this.showTableMessage = false;
      this.messageIndex2 = (this.messageIndex2 + 1) % this.messageSets.door.length;
      
      if (this.messageSets.door[this.messageIndex2] !== '门没关') {
        setTimeout(() => this.showDoorMessage = false, 2000);
      } else {
        if (this.currentLevel === 1) {
          // 第一关通关
          this.gameState = GameState.LEVEL_COMPLETE;
          this.isGameCompleted = true;
          
          // 3秒后进入第二关
          this.levelCompleteTimer = setTimeout(() => {
            this.startLevel(2);
            this.levelCompleteTimer = null;
          }, 3000);
        } else {
          // 第二关通关
          this.gameState = GameState.OVER;
          this.isGameCompleted = true;
        }
      }
    }
  }
  else if (this.gameState === GameState.LEVEL_2) {
    // 第二关的射击逻辑
    if (this.main && this.main.player) {
      this.main.player.shoot();
    }
  }
}
resetToMenu() {
  this.gameState = GameState.MENU;
  this.isGameCompleted = false;
  this.currentLevel = 1; // 重置为第一关
  this.messageIndex1 = 0;
  this.messageIndex2 = 0;
  this.messageIndex3 = 0;
  this.messageIndex4 = 0;
  this.scene.offsetX = 0;
  this.initGameObjects();
  this.loadGameAssets();
  
  // 清除计时器
  if (this.levelCompleteTimer) {
    clearTimeout(this.levelCompleteTimer);
    this.levelCompleteTimer = null;
  }
}
startLevel(level) {
  this.currentLevel = level;
  // 重置摇杆状态
  this.joystick.reset();
  if (level === 1) {
    // 第一关初始化
    this.scene.width = this.backgrounds.tileWidth * 3;
    this.scene.offsetX = 0;
    this.scene.maxOffset = Math.min(0, this.windowInfo.windowWidth - this.scene.width);
     // 初始化游戏对象位置
     this.player.reset(
      100, // X位置从左侧开始
      this.windowInfo.windowHeight / 2
    );
    this.door.worldX = 3500;
    this.trashBin.worldX = 1000;
    this.safe.worldX = 2000;
    this.table.worldX = 1500;
  
    this.gameState = GameState.PLAYING;
  } else if (level === 2) {
    // 第二关初始化
    this.scene.width = this.backgrounds.tileWidth * 3;
    this.scene.offsetX = 0;
    this.scene.maxOffset = Math.min(0, this.windowInfo.windowWidth - this.scene.width);
    // 第二关布局
    this.player.reset(
      100, // X位置从左侧开始
      this.windowInfo.windowHeight / 2 
    );
    this.main = new Main1(
      this, 
      this.main.imageMap.get('player').image, // 角色图片
      this.main.imageMap.get('enemy') ? this.main.imageMap.get('enemy').image : null // 敌机图片
    );
    this.gameState = GameState.LEVEL_2;
  }else if (level === 3) {
    // 第三关初始化
    this.scene.width = this.backgrounds.tileWidth * 3;
    this.scene.offsetX = 0;
    this.scene.maxOffset = Math.min(0, this.windowInfo.windowWidth - this.scene.width);
    this.player.reset(100, this.windowInfo.windowHeight / 2);
    this.initLevel3();
    this.gameState = GameState.LEVEL_3;
  }
}
// 触摸事件处理（整合状态判断）
handleTouchStart(e) {
  if (this.gameState === GameState.MENU) {
    this.handleMenuTouch(e);
  } else if (this.gameState === GameState.PLAYING || this.gameState === GameState.LEVEL_2) {
    const touch = e.touches[0];
    // 检测菜单按钮点击
    if (this.isMenuButtonTouched(touch)) {
      this.menuButton.isPressed = true;
      return;
    }
    const distance = Math.sqrt(
      Math.pow(touch.clientX - this.fButton.x, 2) + Math.pow(touch.clientY - this.fButton.y,2));
    if (distance < this.fButton.size/2) {
      this.fButton.isPressed = true;
      this.handleInteraction();
      return;
    }
    this.handleGameTouch(e);
  }
  else if (this.gameState === GameState.OVER) {
    // 游戏结束状态下点击屏幕返回菜单
    this.resetToMenu();
  }
}

handleMenuTouch(e) {
  const touch = e.touches[0];
  const rect = this.startButton;
  
  if (touch.clientX >= rect.x && touch.clientX <= rect.x + rect.width &&
      touch.clientY >= rect.y && touch.clientY <= rect.y + rect.height) {
    this.startButton.isPressed = true;
    this.drawMenu();
  }
}

handleGameTouch(e) {
  const touch = e.touches[0];
  const scaleX = this.canvas.width / this.windowInfo.windowWidth;
  const scaleY = this.canvas.height / this.windowInfo.windowHeight;
  
  this.joystick.handleTouchStart(
    touch.clientX * scaleX,
    touch.clientY * scaleY
  );
}

handleTouchMove(e) {
  if (this.gameState === GameState.PLAYING) {
    const touch = e.touches[0];
    const scaleX = this.canvas.width / this.windowInfo.windowWidth;
    const scaleY = this.canvas.height / this.windowInfo.windowHeight;
    
    this.joystick.handleTouchMove(
      touch.clientX * scaleX,
      touch.clientY * scaleY
    );
  }
  //GameState.LEVEL_2
  if (this.gameState === GameState.LEVEL_2) {
    const touch = e.touches[0];
    const scaleX = this.canvas.width / this.windowInfo.windowWidth;
    const scaleY = this.canvas.height / this.windowInfo.windowHeight;
    
    this.joystick.handleTouchMove(
      touch.clientX * scaleX,
      touch.clientY * scaleY
    );
  }
}
// 菜单按钮触摸检测方法
isMenuButtonTouched(touch) {
  const btn = this.menuButton;
  return touch.clientX >= btn.x && 
         touch.clientX <= btn.x + btn.width &&
         touch.clientY >= btn.y && 
         touch.clientY <= btn.y + btn.height;
 }
handleTouchEnd() {
   // 菜单按钮释放处理
   if (this.menuButton.isPressed) {
    this.menuButton.isPressed = false;
    this.gameState = GameState.MENU;
    return;
  }
  if (this.gameState === GameState.MENU && this.startButton.isPressed) {
    this.startButton.isPressed = false;
    this.fButton.isPressed = false;
    this.startGame();
    return;
  }
  if (this.gameState === GameState.LEVEL_2 && this.main && this.main.gameOver) {
    // 如果第二关游戏结束，点击屏幕立即重置
    this.main.resetGame();
  }
  if (this.gameState === GameState.OVER) {
    // 清除计时器
    if (this.completeTimer) {
      clearTimeout(this.completeTimer);
      this.completeTimer = null;
    }
    // 重置游戏
    this.resetToMenu();
    return;
  }
  
  this.joystick.handleTouchEnd();
}

handleKeyDown(res) {
  if (this.gameState === GameState.PLAYING && res.keyCode === 69) {
    this.handleInteraction();
  }
}
// 在游戏进行中绘制菜单按钮
drawMenuButton() {
  const btn = this.menuButton;
  this.ctx.fillStyle = btn.isPressed ? '#2980b9' : btn.color;
  this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
  
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = '18px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  this.ctx.fillText(
    btn.text,
    btn.x + btn.width / 2,
    btn.y + btn.height / 2
  );
 }
startGame() {
  this.gameState = GameState.WELCOME; // 设置游戏状态为欢迎页面
  this.welcomeStartTime = Date.now(); // 记录欢迎页面开始时间
}

gameLoop() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
  switch(this.gameState) {
    case GameState.MENU:
      this.drawMenu();
      break;
      case GameState.WELCOME: // 处理欢迎页面状态
      this.drawWelcomeMessage(); // 绘制欢迎页面
      // 检查是否显示时间已超过3秒
      if (Date.now() - this.welcomeStartTime > 3000) {
        this.startLevel(1); // 进入第一关
      }
      break;
    case GameState.PLAYING: // 第一关
      this.updateGameWorld();
      this.renderGameWorld();
      this.drawMenuButton(); // 添加菜单按钮
      break;
    case GameState.LEVEL_2: // 第二关
      this.updateLevel2();
      this.renderLevel2();
      this.drawMenuButton(); // 添加菜单按钮
      break;
    case GameState.LEVEL_3: // 第三关
      this.updateLevel3();
      this.renderLevel3();
      this.drawMenuButton();
      break;
    case GameState.LEVEL_COMPLETE: // 关卡完成过渡
      this.drawLevelComplete();
      break;
    case GameState.OVER: // 游戏完全通关
      this.drawGameOver();
      break;
  }
  
  this.rafId = requestAnimationFrame(this.gameLoop.bind(this));
}

 drawMenu() {
 // 背景 
 this.ctx.fillStyle =  '#FFFFFF';
 this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); 
 // 添加关卡选择按钮
 const level1Button = {
  x: this.windowInfo.windowWidth/2 - 100,
  y: this.windowInfo.windowHeight/2 - 80,
  width: 200,
  height: 60,
  text: '第一关',
  color: '#3498db'
};

const level2Button = {
  x: this.windowInfo.windowWidth/2 - 100,
  y: this.windowInfo.windowHeight/2 + 20,
  width: 200,
  height: 60,
  text: '第二关',
  color: '#e74c3c'
};
const level3Button = {
  x: this.windowInfo.windowWidth/2 - 100,
  y: this.windowInfo.windowHeight/2 + 120,
  width: 200,
  height: 60,
  text: '第三关',
  color: '#9b59b6'
};
// 绘制第一关按钮
this.ctx.fillStyle = level1Button.color;
this.ctx.fillRect(level1Button.x, level1Button.y, level1Button.width, level1Button.height);
this.ctx.fillStyle = '#FFFFFF';
this.ctx.font = '24px Arial';
this.ctx.fillText(
  level1Button.text,
  level1Button.x + level1Button.width/2,
  level1Button.y + level1Button.height/2
);

// 绘制第二关按钮
this.ctx.fillStyle = level2Button.color;
this.ctx.fillRect(level2Button.x, level2Button.y, level2Button.width, level2Button.height);
this.ctx.fillStyle = '#FFFFFF';
this.ctx.fillText(
  level2Button.text,
  level2Button.x + level2Button.width/2,
  level2Button.y + level2Button.height/2
);
// 绘制第三关按钮
this.ctx.fillStyle = level3Button.color;
this.ctx.fillRect(level3Button.x, level3Button.y, level3Button.width, level3Button.height);
this.ctx.fillStyle = '#FFFFFF';
this.ctx.fillText(
  level3Button.text,
  level3Button.x + level3Button.width/2,
  level3Button.y + level3Button.height/2
);
wx.onTouchStart((e) => {
  const touch = e.touches[0];
  if (touch.clientX >= level1Button.x && touch.clientX <= level1Button.x + level1Button.width &&
      touch.clientY >= level1Button.y && touch.clientY <= level1Button.y + level1Button.height) {
    this.startLevel(1);
  } else if (touch.clientX >= level2Button.x && touch.clientX <= level2Button.x + level2Button.width &&
             touch.clientY >= level2Button.y && touch.clientY <= level2Button.y + level2Button.height) {
    this.startLevel(2);
  }
  if (touch.clientX >= level3Button.x && touch.clientX <= level3Button.x + level3Button.width &&
    touch.clientY >= level3Button.y && touch.clientY <= level3Button.y + level3Button.height) {
  this.startLevel(3);
}
});
 // 按钮 
 const btn = this.startButton; 
 this.ctx.fillStyle = btn.isPressed ? '#CC6600' : btn.color; 
 this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);  
 
 this.ctx.fillStyle = '#FFFFFF'; 
 this.ctx.font = '24px Arial'; 
 this.ctx.textAlign = 'center'; 
 this.ctx.textBaseline = 'middle'; 
 this.ctx.fillText( 
 btn.text, 
 btn.x + btn.width/2, 
 btn.y + btn.height/2 
 ); 
 } 

 updateJoystick (touch) {
 const deltaX = touch.clientX - this.joystick.baseX;
 const deltaY = touch.clientY - this.joystick.baseY;
 const distance = Math.sqrt(deltaX**2 + deltaY**2);
 const maxDistance = 40;

 if (distance > maxDistance) {
 const angle = Math.atan2(deltaY, deltaX);
 this.joystick. stickX = this.joystick.baseX + Math.cos(angle) * maxDistance;
 this.joystick.stickY = this.joystick.baseY + Math.sin(angle) * maxDistance;
 } else {
 this.joystick.stickX = touch.clientX;
 this.joystick.stickY = touch.clientY;
 }
 }

 updateGameWorld() {
  if (this.joystick.isActive) {
    const direction = this.joystick.getDirection();
    const moveX = direction.x * Math.min(this.player.speed, 5);
    const moveY = direction.y * Math.min(this.player.speed, 5);

    // 更新世界坐标
    const newWorldX = this.player.worldX + moveX;
    const newWorldY = this.player.worldY + moveY;

    // 边界检测 - 根据当前关卡调整
    const levelBounds = this.currentLevel === 1 ? 
      { minX: 0, maxX: this.backgrounds.tileWidth * 3 - this.player.size } :
      { minX: 0, maxX: this.backgrounds.tileWidth * 3 - this.player.size };
    
    this.player.worldX = Math.max(
      levelBounds.minX,
      Math.min(levelBounds.maxX, newWorldX)
    );

    this.player.worldY = Math.max(
      0,
      Math.min(
        this.windowInfo.windowHeight - this.player.size,
        newWorldY
      )
    );

    // 场景跟随逻辑
    const screenCenter = this.windowInfo.windowWidth / 2;
    const playerScreenX = this.player.worldX + this.scene.offsetX;
    const bufferZone = 0.01; // 缓冲区域

    // 向右移动
    if (direction.x > 0 && playerScreenX > screenCenter - bufferZone) {
      const needScroll = playerScreenX - (screenCenter - bufferZone);
      this.scene.offsetX -= needScroll;
      this.scene.offsetX = Math.max(this.scene.offsetX, this.scene.maxOffset);
    }

    // 向左移动
    if (direction.x < 0 && playerScreenX < screenCenter + bufferZone) {
      const needScroll = (screenCenter + bufferZone) - playerScreenX;
      this.scene.offsetX += needScroll;
      this.scene.offsetX = Math.min(this.scene.offsetX, this.scene.minOffset);
    }
    
    // 碰撞检测
    this.updateInteractions();
  }
}

// 分离出来的碰撞检测方法
updateInteractions() {
  this.trashBin.canInteract = this.player.checkCollision({
    worldX: this.trashBin.worldX,
    worldY: this.trashBin.worldY,
    size: this.trashBin.size
  });
  
  this.safe.canInteract = this.player.checkCollision({
    worldX: this.safe.worldX,
    worldY: this.safe.worldY,
    size: this.safe.size
  });
  
  this.table.canInteract = this.player.checkCollision({
    worldX: this.table.worldX,
    worldY: this.table.worldY,
    size: this.table.size
  });

  this.door.canInteract = this.player.checkCollision({
    worldX: this.door.worldX,
    worldY: this.door.worldY,
    size: this.door.size
  });
}
 renderGameWorld() {
   // 计算需要显示的背景图
   this.updateBackgroundTiles();
    // 绘制背景图序列
    this.backgrounds.tiles.forEach(tile => {
      const img = this.main.imageMap.get(tile.key);
      if (img) {
        this.ctx.drawImage(
          img.image,
          tile.x + this.scene.offsetX,
          0,
          this.backgrounds.tileWidth,
          this.canvas.height
        );
      }
    });
    this.door.draw(this.ctx, this.scene.offsetX);
   this.trashBin.draw(this.ctx, this.scene.offsetX);
   this.safe.draw(this.ctx, this.scene.offsetX);
   this.table.draw(this.ctx, this.scene.offsetX);
   this.joystick.draw(this.ctx); 
   this.drawFButton();
    this.player.draw(this.ctx , this.scene.offsetX);
    // 交互提示
  if (this.door.canInteract || this.trashBin.canInteract ||this.safe.canInteract ||this.table.canInteract) {
    this.drawInteractionPrompt();
  }
   // 显示交互提示
   if (this.showTrashMessage || this.showDoorMessage ||this.showSafeMessage ||this.showTableMessage) {
    this.drawInteractionPrompt();
  }
}
updateLevel2() {
  if (this.main) {
    // 第二关更新逻辑
    const direction = this.joystick.isActive ? this.joystick.getDirection() : null;
    this.main.update(direction);
  }
}
renderLevel2() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
  if (this.main) {
    // 第二关渲染逻辑
    this.main.render(this.ctx);
  }
 // 只有在游戏没有结束时才绘制摇杆和F按钮
 if (!(this.main && this.main.gameOver)) {
  this.joystick.draw(this.ctx); 
  this.drawFButton();
}
  // 绘制关卡提示
  this.ctx.fillStyle = 'rgba(0,255,0,0.5)';
  this.ctx.fillRect(20, 20, 100, 40);
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = '20px Arial';
  this.ctx.textAlign = 'left';
  this.ctx.fillText('第二关', 40, 45);
}
// 第三关更新逻辑
renderLevel3() {
  // 绘制背景
  this.ctx.fillStyle = '#87CEEB';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
  // 绘制平台
  this.platforms.forEach((platform, index) => {
    // 平台阴影
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 5;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    this.ctx.fillStyle = platform.color;
    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // 移除阴影
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    
    // 绘制平台边框
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    
    // 在终点平台上绘制旗帜
    if (platform.type === 'end') {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.moveTo(platform.x + platform.width - 10, platform.y - 30);
      this.ctx.lineTo(platform.x + platform.width - 10, platform.y - 10);
      this.ctx.lineTo(platform.x + platform.width - 30, platform.y - 20);
      this.ctx.closePath();
      this.ctx.fill();
    }
  });
  
  // 绘制玩家
  this.player.draw(this.ctx, 0);
  
  // 绘制UI
  this.drawLevel3UI();
}

// 优化：分离UI绘制
drawLevel3UI() {
  // 绘制分数
  this.ctx.fillStyle = '#2c3e50';
  this.ctx.font = 'bold 24px Arial';
  this.ctx.textAlign = 'left';
  this.ctx.fillText(`分数: ${this.level3Score}`, 20, 40);
  
  // 绘制进度
  const progressWidth = this.windowInfo.windowWidth - 40;
  const progress = this.level3Progress / (this.platforms.length - 1);
  
  // 进度条
  this.ctx.fillStyle = '#ecf0f1';
  this.ctx.fillRect(20, 70, progressWidth, 15);
  this.ctx.fillStyle = '#3498db';
  this.ctx.fillRect(20, 70, progressWidth * progress, 15);
  
  // 进度文本
  this.ctx.fillStyle = '#2c3e50';
  this.ctx.font = '18px Arial';
  this.ctx.fillText(
    `进度: ${this.level3Progress}/${this.platforms.length - 1}`, 
    this.windowInfo.windowWidth / 2, 
    90
  );
  
  // 绘制蓄力条
  if (this.isCharging) {
    this.drawPowerBar();
  }
  
  // 绘制操作提示
  this.ctx.fillStyle = '#34495e';
  this.ctx.font = '20px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('K键跳跃 | 摇杆左右移动', 
    this.windowInfo.windowWidth / 2, 
    this.windowInfo.windowHeight - 50
  );
  
  // 绘制关卡标题
  this.ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
  this.ctx.fillRect(20, 20, 120, 40);
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = '20px Arial';
  this.ctx.textAlign = 'left';
  this.ctx.fillText('第三关', 50, 50);
  
  // 状态提示
  this.drawStatusMessage();
}

// 优化：蓄力条绘制
drawPowerBar() {
  const barWidth = 100;
  const barHeight = 20;
  const barX = this.windowInfo.windowWidth / 2 - barWidth / 2;
  const barY = this.windowInfo.windowHeight - 100;
  
  // 背景
  this.ctx.fillStyle = '#ecf0f1';
  this.ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // 前景 - 根据蓄力值改变颜色
  let fillColor = '#2ecc71'; // 绿色
  if (this.jumpPower > 15) fillColor = '#e74c3c'; // 红色
  else if (this.jumpPower > 10) fillColor = '#f39c12'; // 橙色
  
  this.ctx.fillStyle = fillColor;
  this.ctx.fillRect(barX, barY, barWidth * (this.jumpPower / 20), barHeight);
  
  // 边框
  this.ctx.strokeStyle = '#2c3e50';
  this.ctx.lineWidth = 2;
  this.ctx.strokeRect(barX, barY, barWidth, barHeight);
}

// 优化：状态消息绘制
drawStatusMessage() {
  if (this.level3State === 'ready') {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.font = 'bold 30px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('按住K键蓄力跳跃', 
      this.windowInfo.windowWidth / 2, 
      this.windowInfo.windowHeight / 2
    );
  }
  else if (this.level3State === 'failed') {
    this.ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('失败!', 
      this.windowInfo.windowWidth / 2, 
      this.windowInfo.windowHeight / 2
    );
  }
  else if (this.level3State === 'completed') {
    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('通关成功!', 
      this.windowInfo.windowWidth / 2, 
      this.windowInfo.windowHeight / 2
    );
  }
}
// 在handleKeyDown中添加K键处理
handleKeyDown(res) {
  if (this.gameState === GameState.PLAYING && res.keyCode === 69) {
    this.handleInteraction();
  }
  // K键跳跃（第三关）
  else if (this.gameState === GameState.LEVEL_3 && res.keyCode === 75) {
    if (this.level3State === 'ready' || this.level3State === 'landed') {
      this.isCharging = true;
      this.jumpChargeStart = Date.now();
      
      // 计算跳跃方向（基于摇杆位置）
      if (this.joystick.isActive) {
        const direction = this.joystick.getDirection();
        this.jumpDirectionX = direction.x;
      } else {
        this.jumpDirectionX = 0; // 无摇杆输入时垂直跳跃
      }
    }
  }
}

// 在handleKeyUp中添加K键释放处理
handleKeyUp(res) {
  if (this.gameState === GameState.LEVEL_3 && res.keyCode === 75) {
    if (this.isCharging) {
      this.isCharging = false;
      this.isJumping = true;
      this.velocityY = -this.jumpPower;
      this.jumpPower = 0;
      GameGlobal.musicManager.playSound('jump');
    }
  }
}
// 新增背景图更新方法
updateBackgroundTiles() {
  const viewportLeft = -this.scene.offsetX;
  const viewportRight = viewportLeft + this.windowInfo.windowWidth;
  const tileSize = this.backgrounds.tileWidth;

  // 计算起始索引
  const startIndex = Math.floor(viewportLeft / tileSize);
  const endIndex = Math.ceil(viewportRight / tileSize);

  // 生成当前需要渲染的图块
  this.backgrounds.tiles = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const keyIndex = Math.abs(i) % this.backgrounds.images.length;
    this.backgrounds.tiles.push({
      key: this.backgrounds.images[keyIndex],
      x: i * tileSize
    });
  }
}
  // 资源预加载
  preloadResources() {
    const images = [
      {url: 'images/background-5.jpg', key: 'background1'},
      {url: 'images/background-5.jpg', key: 'background2'},
      {url: 'images/background-5.jpg', key: 'background3'},
      {url: 'images/background-2.jpg', key: 'background4'}, // 第二关背景1
      {url: 'images/background-2.jpg', key: 'background5'}, // 第二关背景2
      {url: 'images/background-2.jpg', key: 'background6'}, // 第二关背景3
      {url: 'images/player-1.png', key: 'player'},
      {url: 'images/taomujian-3.png', key: 'enemy'}, // 敌机图片
      {url: 'images/joystick-1.png', key: 'joystick'},
      {url: 'images/door-2.png', key: 'door'},
      {url: 'images/safe-1.png', key: 'safe'},
      {url: 'images/table.png', key: 'table'},
      {url: 'images/trashbin-2.png', key: 'trashbin'}
    ];

  this.main.preloadResources(images, (success) => {
    if (success) {
      // 在资源加载完成后设置tileWidth
      const bgImg = this.main.imageMap.get('background1');
      this.backgrounds.tileWidth = bgImg?.image?.width || 750; 
      
      // 更新场景宽度
      this.scene.width = this.backgrounds.tileWidth * 3;
      
      // 重新计算场景边界
      this.scene.maxOffset = Math.min(
        0,
        this.windowInfo.windowWidth - this.scene.width
      );
      
      this.loadGameAssets();
      this.drawMenu();
    }
  });
  }

  loadGameAssets() {
    this.player.img = this.main.imageMap.get('player');
    this.joystick.bgImg = this.main.imageMap.get('joystick');
    this.joystick.knobImg = this.main.imageMap.get('joystick');
    this.door.img = this.main.imageMap.get('door');
    this.trashBin.img = this.main.imageMap.get('trashbin');
    this.safe.img = this.main.imageMap.get('safe');
    this.table.img = this.main.imageMap.get('table');
  }

  // 新增F按钮绘制方法
drawFButton() {
  this.ctx.save();
  this.ctx.globalAlpha = this.fButton.opacity;
  // 按钮背景
  this.ctx.fillStyle = this.fButton.isPressed ? '#404040' : '#808080';
  this.ctx.beginPath();
  this.ctx.arc(
    this.fButton.x,
    this.fButton.y,
    this.fButton.size/2,
    0,
    Math.PI * 2
  );
  this.ctx.fill();
  // 按钮文字
  this.ctx.fillStyle = '#e0e0e0';
  this.ctx.font = '30px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  this.ctx.fillText(
    'F',
    this.fButton.x,
    this.fButton.y
  );
  
  this.ctx.restore();
}
// 修改交互提示方法
drawInteractionPrompt() {
  let message = '';
  if (this.showTrashMessage) {
    message = this.messageSets.trash[this.messageIndex1];
  } else if (this.showDoorMessage) {
    message = this.messageSets.door[this.messageIndex2];
  }else if (this.showSafeMessage) {
    message = this.messageSets.safe[this.messageIndex3];
  }else if (this.showTableMessage) {
    message = this.messageSets.table[this.messageIndex4];
  }
  this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
  this.ctx.fillRect(
    this.windowInfo.windowWidth/2 - 100,
    this.windowInfo.windowHeight - 80,
    200,
    40
  );

  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = '18px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText(
    message,
    this.windowInfo.windowWidth/2,
    this.windowInfo.windowHeight - 60
  );
}
// 添加欢迎页面绘制方法
drawWelcomeMessage() {
  // 清空画布
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  // 绘制背景
  this.ctx.fillStyle = '#3498db';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  // 绘制游戏标题
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = 'bold 30px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  this.ctx.fillText(
    '欢迎来到',
    this.windowInfo.windowWidth / 2,
    this.windowInfo.windowHeight / 2 - 60
  );
  // 绘制欢迎信息
  this.ctx.font = '50px Arial';
  this.ctx.fillText(
    '芙幽之旅',
    this.windowInfo.windowWidth / 2,
    this.windowInfo.windowHeight / 2
  );
  
  // 绘制提示信息
  this.ctx.font = '24px Arial';
  this.ctx.fillText(
    '正在加载游戏...',
    this.windowInfo.windowWidth / 2,
    this.windowInfo.windowHeight / 2 + 60
  );
  // 绘制进度条
  const progress = Math.min(1, (Date.now() - this.welcomeStartTime) / 3000);
  const barWidth = this.windowInfo.windowWidth * 0.6;
  const barHeight = 20;
  const barX = (this.windowInfo.windowWidth - barWidth) / 2;
  const barY = this.windowInfo.windowHeight / 2 + 120;
  // 进度条背景
  this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  this.ctx.fillRect(barX, barY, barWidth, barHeight);
  // 进度条前景
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
  // 进度文本
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = '20px Arial';
  this.ctx.fillText(
    `${Math.round(progress * 100)}%`,
    this.windowInfo.windowWidth / 2,
    barY + 40
  );
}
drawLevelComplete() {
  // 清空画布
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  // 绘制当前关卡背景
  this.updateBackgroundTiles();
  this.backgrounds.tiles.forEach(tile => {
    const img = this.main.imageMap.get(tile.key);
    if (img) {
      this.ctx.drawImage(
        img.image,
        tile.x + this.scene.offsetX,
        0,
        this.backgrounds.tileWidth,
        this.canvas.height
      );
    }
  });
  
  // 半透明遮罩
  this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  // 关卡完成文字
  this.ctx.fillStyle = '#4CAF50';
  this.ctx.font = 'bold 40px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  this.ctx.fillText(
    '第一关完成！',
    this.windowInfo.windowWidth / 2,
    this.windowInfo.windowHeight / 2 - 40
  );

  // 提示文字
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = '24px Arial';
  this.ctx.fillText(
    '准备进入第二关...',
    this.windowInfo.windowWidth / 2,
    this.windowInfo.windowHeight / 2 + 40
  );
}
// 修改drawGameOver方法
drawGameOver() {
  // 清空画布
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  // 先绘制游戏世界背景
  this.updateBackgroundTiles();
  this.backgrounds.tiles.forEach(tile => {
    const img = this.main.imageMap.get(tile.key);
    if (img) {
      this.ctx.drawImage(
        img.image,
        tile.x + this.scene.offsetX,
        0,
        this.backgrounds.tileWidth,
        this.canvas.height
      );
    }
  });
  
  // 半透明遮罩
  this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  // 通关文字
  this.ctx.fillStyle = '#4CAF50';
  this.ctx.font = 'bold 40px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  this.ctx.fillText(
    '通关成功！',
    this.windowInfo.windowWidth / 2,
    this.windowInfo.windowHeight / 2 - 40
  );

  // 提示文字
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = '24px Arial';
  this.ctx.fillText(
    '点击屏幕返回菜单',
    this.windowInfo.windowWidth / 2,
    this.windowInfo.windowHeight / 2 + 40
  );
}
 // 修改 stop 方法
 stop() {
  if (this.rafId) {
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}
}

// 第二关主游戏逻辑类
class Main1 {
  constructor(game,playerImg,enemyImg) {
    this.game = game;
    this.aniId = 0;
    this.score = 0;
    this.gameOver = false;
    this.frameCount = 0;
    
    // 初始化玩家飞机，使用游戏实例中的窗口信息和角色图片
    this.player = new PlayerPlane(
      game.windowInfo.windowWidth,
      game.windowInfo.windowHeight,
      playerImg // 使用第一关的角色图片
    );
    // 敌机图片
    this.enemyImg = enemyImg;
    // 开始游戏循环
    this.start();
  }

  start() {
    this.gameOver = false;
    this.score = 0;
    this.frameCount = 0;
    this.player = new PlayerPlane(
      this.game.windowInfo.windowWidth,
      this.game.windowInfo.windowHeight,
      this.player.img // 保留角色图片
    );
    this.enemies = [];
    
    if (this.aniId) {
      cancelAnimationFrame(this.aniId);
    }
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  enemyGenerate() {
    // 每30帧生成一个敌机
    if (this.frameCount % ENEMY_GENERATE_INTERVAL === 0) {
      const enemy = new Enemy(
        this.game.windowInfo.windowWidth,
        this.game.windowInfo.windowHeight,
        this.enemyImg // 传入敌机图片
      );
      enemy.init();
      this.enemies.push(enemy);
    }
  }
  resetGame() {
    this.start(); // 调用现有的start方法重置游戏
  }
  collisionDetection() {
    // 检测子弹与敌机的碰撞
    this.player.bullets.forEach(bullet => {
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (enemy.active && bullet.isCollideWith(enemy)) {
          enemy.active = false;
          bullet.active = false;
          this.score += 10;
          break;
        }
      }
    });

    // 检测玩家与敌机的碰撞
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (enemy.active && enemy.isCollideWith(this.player)) {
        this.player.active = false;
        this.gameOver = true;
        // 3秒后自动重置游戏
        setTimeout(() => {
          this.resetGame();
        }, 3000);
        break;
      }
    }
  }

  render(ctx) {
    // 清空画布
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制背景 - 使用纯色背景
    ctx.fillStyle = '#87CEEB'; // 天蓝色背景
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 绘制玩家和子弹
    this.player.draw(ctx);
    
    // 绘制敌机
    this.enemies.forEach(enemy => enemy.draw(ctx));
    
    // 绘制分数
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`分数: ${this.score}`, 120, 45);
    
    // 绘制关卡提示
    ctx.fillStyle = 'rgba(0,255,0,0.5)';
    ctx.fillRect(20, 20, 100, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('第二关', 40, 45);
    
    // 游戏结束提示
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('游戏结束', ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px Arial';
      ctx.fillText(`最终分数: ${this.score}`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
      
      ctx.fillText('点击屏幕返回菜单', ctx.canvas.width / 2, ctx.canvas.height / 2 + 80);
    }
  }

  update(direction) {
    if (this.gameOver) return;
    this.frameCount++;
    // 更新玩家飞机
    this.player.update(direction);
    // 更新敌机
    this.enemies.forEach(enemy => enemy.update());
    // 移除非活动的敌机
    this.enemies = this.enemies.filter(enemy => enemy.active);
    // 生成新敌机
    this.enemyGenerate();
    // 碰撞检测
    this.collisionDetection();
  }
  loop() {
    this.update(this.game.joystick.getDirection());
    this.render(this.game.ctx);
    
    if (!this.gameOver) {
      this.aniId = requestAnimationFrame(this.loop.bind(this));
    }
  }
}
// 启动游戏
new Game();