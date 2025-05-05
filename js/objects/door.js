import InteractiveObject from '../interactive'

export default class Door extends InteractiveObject {
  constructor(x, y) {
    super(x, y, 80, 120, '按E开门')
    this.isOpen = false
  }

  interact() {
    if (!this.isOpen) {
      this.text = '门已开启！'
      this.isOpen = true
    }
  }
}