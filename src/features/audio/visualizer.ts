import { stemIds, type StemId } from './stems'
import type { StemMeters } from './audioEngine'

const stemColors: Record<StemId, string> = {
  vocals: '#0f766e',
  percussion: '#b45309',
  melody: '#2563eb',
  residue: '#9f1239',
}

export class Visualizer {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private analyser: AnalyserNode | null = null
  private animationFrame = 0
  private waveform = new Uint8Array(2048)
  private meters: StemMeters = {
    input: 0,
    output: 0,
    stems: {
      vocals: 0,
      percussion: 0,
      melody: 0,
      residue: 0,
    },
  }

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2D context is unavailable')
    }
    this.canvas = canvas
    this.context = context
  }

  setAnalyser(analyser: AnalyserNode | null): void {
    this.analyser = analyser
    if (analyser) {
      this.waveform = new Uint8Array(analyser.fftSize)
    }
  }

  setMeters(meters: StemMeters): void {
    this.meters = meters
  }

  start(): void {
    if (this.animationFrame) return
    const draw = () => {
      this.draw()
      this.animationFrame = window.requestAnimationFrame(draw)
    }
    draw()
  }

  stop(): void {
    window.cancelAnimationFrame(this.animationFrame)
    this.animationFrame = 0
    this.draw()
  }

  private draw(): void {
    const rect = this.canvas.getBoundingClientRect()
    const scale = window.devicePixelRatio || 1
    const width = Math.max(1, Math.round(rect.width * scale))
    const height = Math.max(1, Math.round(rect.height * scale))

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }

    const ctx = this.context
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = '#101615'
    ctx.fillRect(0, 0, rect.width, rect.height)

    this.drawGrid(rect.width, rect.height)
    this.drawWaveform(rect.width, rect.height)
    this.drawStemBars(rect.width, rect.height)
  }

  private drawGrid(width: number, height: number): void {
    const ctx = this.context
    ctx.strokeStyle = 'rgba(231, 236, 230, 0.12)'
    ctx.lineWidth = 1

    for (let x = 0; x <= width; x += width / 8) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y += height / 5) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  private drawWaveform(width: number, height: number): void {
    const ctx = this.context
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.waveform)
    } else {
      this.waveform.fill(128)
    }

    ctx.strokeStyle = '#ecfdf5'
    ctx.lineWidth = 2
    ctx.beginPath()

    const step = width / Math.max(1, this.waveform.length - 1)
    for (let index = 0; index < this.waveform.length; index += 1) {
      const value = (this.waveform[index] - 128) / 128
      const y = height * 0.44 + value * height * 0.28
      const x = index * step
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.stroke()
  }

  private drawStemBars(width: number, height: number): void {
    const ctx = this.context
    const barWidth = Math.max(28, width / 16)
    const gap = 10
    const totalWidth = stemIds.length * barWidth + (stemIds.length - 1) * gap
    const startX = width - totalWidth - 24
    const baseY = height - 26
    const maxHeight = height * 0.34

    stemIds.forEach((id, index) => {
      const value = Math.min(1, Math.max(0, this.meters.stems[id] * 3.4))
      const x = startX + index * (barWidth + gap)
      const barHeight = Math.max(3, value * maxHeight)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.fillRect(x, baseY - maxHeight, barWidth, maxHeight)
      ctx.fillStyle = stemColors[id]
      ctx.fillRect(x, baseY - barHeight, barWidth, barHeight)
    })
  }
}
