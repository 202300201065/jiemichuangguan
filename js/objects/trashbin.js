import InteractiveObject from '../interactive'

export default class TrashBin extends InteractiveObject {
  constructor(x, y) {
    super(x, y, 60, 90, '查看垃圾桶')
    this.messages = [
      '空的饮料瓶',
      '皱巴巴的纸团',
      '昨天的外卖盒'
    ]
  }

  interact() {
    const randomIndex = Math.floor(Math.random() * this.messages.length)
    this.text = this.messages[randomIndex]
  }
}