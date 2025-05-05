import Main from './js/runtime'
import Player from './js/player'
import Joystick from './js/joystick'
import Door from './js/objects/door'
import TrashBin from './js/objects/trashbin'

export default class Game {
  constructor() {
    // 确保按顺序初始化
    this.canvas = wx.createCanvas()
    this.context = this.canvas.getContext('2d')
    this.systemInfo = wx.getSystemInfoSync()
    
    // 1. 先初始化Main
    this.main = new Main()
    
    // 2. 初始化游戏循环函数（移到前面）
    this.frameFunc = () => {
      this.loop()
      this.rafId = requestAnimationFrame(this.frameFunc.bind(this))
    }

    // 3. 初始化其他组件
    this.player = new Player(
      this.systemInfo.windowWidth / 2,
      this.systemInfo.windowHeight / 2,
      this.systemInfo.windowWidth,
      this.systemInfo.windowHeight
    )
    
    this.joystick = new Joystick(
      this.systemInfo.windowWidth - 100,
      this.systemInfo.windowHeight - 100
    )
    
    this.door = new Door(100, this.systemInfo.windowHeight - 150)
    this.trashBin = new TrashBin(
      this.systemInfo.windowWidth - 150,
      this.systemInfo.windowHeight - 120
    )
    
    // 初始化状态
    this.rafId = null
    this.loaded = false
    
    // 启动游戏
    this.initTouchEvents()
    this.initKeyboardEvents()
    this.preloadResources()
  }

  initKeyboardEvents() {
    wx.onKeyDown((res) => {
      if (!this.loaded) return
      
      // 按E键交互
      if (res.keyCode === 69) {
        if (this.door.canInteract) {
          this.door.text = "门已打开！"
          this.door.showText(this.context, this.systemInfo.windowWidth)
        }
        
        if (this.trashBin.canInteract) {
          this.trashBin.showText(this.context, this.systemInfo.windowWidth)
        }
      }
    })
  }

  initTouchEvents() {
    wx.onTouchStart((e) => {
      if (!this.loaded) return
      
      // 添加坐标转换（修复触摸位置问题）
      const touch = e.touches[0]
      const scaleX = this.canvas.width / this.systemInfo.windowWidth
      const scaleY = this.canvas.height / this.systemInfo.windowHeight
      const clientX = touch.clientX * scaleX
      const clientY = touch.clientY * scaleY
      
      this.joystick.handleTouchStart(clientX, clientY)
    })
    
    wx.onTouchMove((e) => {
      if (!this.loaded) return
      const touch = e.touches[0]
      const scaleX = this.canvas.width / this.systemInfo.windowWidth
      const scaleY = this.canvas.height / this.systemInfo.windowHeight
      const clientX = touch.clientX * scaleX
      const clientY = touch.clientY * scaleY
      
      this.joystick.handleTouchMove(clientX, clientY)
    })
    
    wx.onTouchEnd(() => {
      if (!this.loaded) return
      this.joystick.handleTouchEnd()
    })
  }

  preloadResources() {
    // 添加门和垃圾桶的图片资源
    const images = [
      {url: 'images/background.png', key: 'background'},
      {url: 'images/player.jpg', key: 'player'},    // 建议使用PNG格式
      {url: 'images/joystick.png', key: 'joystick'},
      {url: 'images/door.png', key: 'door'},
      {url: 'images/trashbin.png', key: 'trashbin'}
    ]
    
    this.main.preloadResources(images, (success) => {
      if (success) {
        // 分配所有图片资源
        this.player.img = this.main.imageMap.get('player')
        this.joystick.bgImg = this.main.imageMap.get('joystick')
        this.joystick.knobImg = this.main.imageMap.get('joystick')
        this.door.img = this.main.imageMap.get('door')
        this.trashBin.img = this.main.imageMap.get('trashbin')
        
        this.loaded = true
        this.frameFunc()
      }
    })
  }

  loop() {
    if (!this.loaded) return
    
    this.context.clearRect(0, 0, this.systemInfo.windowWidth, this.systemInfo.windowHeight)
    
    // 绘制背景
    const bgImg = this.main.imageMap.get('background')
    if (bgImg?.image) {
      bgImg.draw(this.context, 0, 0, this.systemInfo.windowWidth, this.systemInfo.windowHeight)
    }
    
    // 更新和绘制玩家
    this.player.update(this.joystick.direction, this.joystick.force)
    this.player.draw(this.context)
    
    // 绘制摇杆
    this.joystick.draw(this.context)
    
    // 检查交互
    this.door.checkInteraction(this.player)
    this.trashBin.checkInteraction(this.player)
    
    // 绘制交互对象
    this.door.draw(this.context)
    this.trashBin.draw(this.context)
    
    // 显示交互文本
    if (this.door.isShowingText) {
      this.door.showText(this.context, this.systemInfo.windowWidth)
    }
    if (this.trashBin.isShowingText) {
      this.trashBin.showText(this.context, this.systemInfo.windowWidth)
    }
    
    // 绘制交互提示
    if (this.door.canInteract || this.trashBin.canInteract) {
      this.drawInteractionPrompt()
    }
  }

  drawInteractionPrompt() {
    this.context.fillStyle = '#ffffff'
    this.context.font = '14px Arial'
    this.context.textAlign = 'center'
    this.context.fillText(
      '按E键交互',
      this.systemInfo.windowWidth / 2,
      this.systemInfo.windowHeight - 30
    )
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}

// 启动游戏
new Game()