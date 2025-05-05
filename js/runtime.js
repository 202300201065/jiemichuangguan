import Bitmap from './base/bitmap'

export default class Main {
  constructor() {
    this.imageMap = new Map()
  }

  preloadResources(images, callback) {
    let loaded = 0
    let errors = 0
    const total = images.length

    const checkDone = () => {
      if (loaded + errors >= total) {
        callback(loaded === total)
      }
    }

    images.forEach(({url, key}) => {
      const img = wx.createImage()
      img.onload = () => {
        if (img.width > 0) {
          this.imageMap.set(key, new Bitmap(img))
          loaded++
        } else {
          errors++
        }
        checkDone()
      }
      img.onerror = () => {
        console.error(`加载失败: ${url}`)
        errors++
        checkDone()
      }
      img.src = url
    })
  }
}