class WebmDurationFixer {
  static Sections = {
    Segment: 0x8538067,
    Info: 0x549a966,
    Duration: 0x489
  }

  constructor() {
    this.source = null
    this.offset = 0
  }

  setSource(source) {
    this.source = source
    this.offset = 0
  }

  readByte() {
    return this.offset < this.source.length ? this.source[this.offset++] : null
  }

  readUint() {
    const byte = this.readByte()
    if (byte === null) return null
    
    let value = byte
    let length = 1
    
    for (let i = 1; i <= 8; i++) {
      if (value & (1 << (8 - i))) {
        length = i
        value &= (1 << (8 - i)) - 1
        break
      }
    }
    
    for (let i = 1; i < length; i++) {
      const nextByte = this.readByte()
      if (nextByte === null) return null
      value = (value << 8) | nextByte
    }
    
    return value
  }

  getSections() {
    const sections = []
    while (this.offset < this.source.length) {
      const id = this.readUint()
      if (id === null) break
      
      const size = this.readUint()
      if (size === null) break
      
      const data = this.source.slice(this.offset, this.offset + size)
      this.offset += size
      sections.push({ id, data })
    }
    return sections
  }

  static async fixDuration(blob, duration) {
    try {
      const buffer = await blob.arrayBuffer()
      const fixer = new WebmDurationFixer()
      fixer.setSource(new Uint8Array(buffer))

      const sections = fixer.getSections()
      const segment = sections.find(s => s.id === this.Sections.Segment)
      if (!segment) return blob

      const segmentFixer = new WebmDurationFixer()
      segmentFixer.setSource(segment.data)
      const infoSections = segmentFixer.getSections()
      const info = infoSections.find(s => s.id === this.Sections.Info)
      if (!info) return blob

      const infoFixer = new WebmDurationFixer()
      infoFixer.setSource(info.data)
      const durSections = infoFixer.getSections()
      
      const floatArray = new Float64Array([duration])
      const durationData = new Uint8Array(floatArray.buffer).reverse()
      
      const durationSection = durSections.find(s => s.id === this.Sections.Duration)
      if (durationSection) {
        durationSection.data = durationData
      } else {
        durSections.push({ id: this.Sections.Duration, data: durationData })
      }

      return new Blob([buffer], { type: blob.type })
    } catch {
      return blob
    }
  }
}

// ThreeRecorder mainly:
// - Captures frames from a canvas
// - Saves them as a WebM video
// - Fixes the duration of the video
// - Downloads the video
// Usage:
// const recorder = new ThreeRecorder(canvas, options)
// recorder.start()
// recorder.stop()
// recorder.save()
// Options:
// - pixelRatio: window.devicePixelRatio
// - frameRate: 60
// - duration: 8000
// - quality: 16000000
// - filename: 'threejs-recording'
// Note: The canvas should have the same size as the renderer
// To easily use 'r' and 's' to start and stop recording:
// window.addEventListener('keydown', e => {
//   if (e.key === 'r') recorder.start()
//   if (e.key === 's') recorder.stop()
// })

// given what it does does not require threejs, it could have been called: CanvasWebmRecorder

export class CanvasWebmRecorder {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.options = {
      pixelRatio: options.pixelRatio || window.devicePixelRatio,
      frameRate: options.frameRate || 60,
      duration: options.duration || 8000,
      quality: options.quality || 16000000,
      filename: options.filename || 'threejs-recording'
    }
    
    this.recordCanvas = document.createElement('canvas')
    this.recordCtx = this.recordCanvas.getContext('2d', {
      willReadFrequently: true,
      alpha: false
    })
    this.recordCanvas.style.imageRendering = 'pixelated'
    
    this.recordedChunks = []
    this.recorder = null
    this.isRecording = false
    this.startTime = null
  }

  start() {
    this.recordedChunks = []
    this.startTime = Date.now()
    
    const min = Math.min(this.canvas.width, this.canvas.height)
    this.recordCanvas.width = this.canvas.width > this.canvas.height ? this.canvas.width : min
    this.recordCanvas.height = this.canvas.height
    
    const stream = this.recordCanvas.captureStream(this.options.frameRate)
    this.recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm',
      videoBitsPerSecond: this.options.quality 
    })
    
    this.recorder.ondataavailable = e => this.recordedChunks.push(e.data)
    this.recorder.onstop = () => this.save()
    
    this.recorder.start()
    this.isRecording = true
    this.captureFrame()

    setTimeout(() => {
      if (this.isRecording) this.stop()
    }, this.options.duration)
  }

  captureFrame() {
    if (!this.isRecording) return
    
    this.recordCtx.imageSmoothingEnabled = false
    this.recordCtx.drawImage(this.canvas, 0, 0, this.recordCanvas.width, this.recordCanvas.height)
    
    requestAnimationFrame(() => this.captureFrame())
  }

  stop() {
    if (this.recorder?.state === 'recording') {
      this.recorder.stop()
      this.isRecording = false
    }
  }

  async save() {
    const buggyBlob = new Blob(this.recordedChunks, { type: 'video/webm' })
    const duration = Date.now() - this.startTime
    const fixedBlob = await WebmDurationFixer.fixDuration(buggyBlob, duration)
    
    const url = URL.createObjectURL(fixedBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${this.options.filename}-${Date.now()}.webm`
    link.click()
    URL.revokeObjectURL(url)
    this.recordedChunks = []
  }
}