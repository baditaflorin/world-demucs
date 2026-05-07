import { toWorkletMixerState, type MixerState, type StemId } from './stems'
import type { RnnoiseProbe, ToneClock } from './processingStack'

export type AudioMode = 'idle' | 'microphone' | 'demo'

export interface EngineStatus {
  mode: AudioMode
  audioContext: 'idle' | 'running' | 'suspended' | 'closed' | 'interrupted'
  worklet: 'idle' | 'loading' | 'ready' | 'error'
  microphone: 'idle' | 'requesting' | 'granted' | 'blocked'
  rnnoiseVad: number
  latencyMs: number
}

export interface StemMeters {
  input: number
  output: number
  stems: Record<StemId, number>
}

const initialStatus: EngineStatus = {
  mode: 'idle',
  audioContext: 'idle',
  worklet: 'idle',
  microphone: 'idle',
  rnnoiseVad: 0,
  latencyMs: 0,
}

export class WorldDemucsEngine extends EventTarget {
  private audioContext: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | AudioNode | null = null
  private stemNode: AudioWorkletNode | null = null
  private preAnalyser: AnalyserNode | null = null
  private outputAnalyser: AnalyserNode | null = null
  private outputGain: GainNode | null = null
  private rnnoiseProbe: RnnoiseProbe | null = null
  private rnnoiseTimer = 0
  private toneClock: ToneClock | null = null
  private demoNodes: AudioScheduledSourceNode[] = []
  private status: EngineStatus = { ...initialStatus }

  getStatus(): EngineStatus {
    return { ...this.status }
  }

  getOutputAnalyser(): AnalyserNode | null {
    return this.outputAnalyser
  }

  async startMicrophone(mixer: MixerState): Promise<void> {
    await this.stop()
    this.setStatus({ mode: 'microphone', microphone: 'requesting', worklet: 'loading' })

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          channelCount: 1,
        },
      })
      this.setStatus({ microphone: 'granted' })
      const context = await this.createContext()
      this.source = context.createMediaStreamSource(this.stream)
      await this.connectSource(context, this.source, mixer)
    } catch (error) {
      await this.stop()
      this.setStatus({ mode: 'idle', microphone: 'blocked', worklet: 'error' })
      throw error
    }
  }

  async startDemo(mixer: MixerState): Promise<void> {
    await this.stop()
    this.setStatus({ mode: 'demo', microphone: 'idle', worklet: 'loading' })

    const context = await this.createContext()
    const bus = context.createGain()
    bus.gain.value = 0.34

    const melody = new OscillatorNode(context, { frequency: 220, type: 'triangle' })
    const voice = new OscillatorNode(context, { frequency: 168, type: 'sawtooth' })
    const pulse = new OscillatorNode(context, { frequency: 3.2, type: 'square' })
    const noise = this.createNoiseSource(context)

    const melodyGain = context.createGain()
    const voiceGain = context.createGain()
    const pulseGain = context.createGain()
    const noiseGain = context.createGain()
    melodyGain.gain.value = 0.24
    voiceGain.gain.value = 0.08
    pulseGain.gain.value = 0.04
    noiseGain.gain.value = 0.13

    melody.connect(melodyGain).connect(bus)
    voice.connect(voiceGain).connect(bus)
    pulse.connect(pulseGain).connect(bus)
    noise.connect(noiseGain).connect(bus)

    this.demoNodes = [melody, voice, pulse, noise]
    for (const node of this.demoNodes) node.start()
    this.source = bus
    await this.connectSource(context, bus, mixer)
  }

  updateMixer(mixer: MixerState): void {
    this.stemNode?.port.postMessage({
      type: 'mixer',
      mixer: toWorkletMixerState(mixer),
    })
    this.toneClock?.setBpm(mixer.bpm)
  }

  attachRnnoiseProbe(probe: RnnoiseProbe | null): void {
    this.rnnoiseProbe?.destroy()
    this.rnnoiseProbe = probe
    this.startRnnoiseLoop()
  }

  attachToneClock(clock: ToneClock | null): void {
    this.toneClock?.dispose()
    this.toneClock = clock
  }

  pulseRhythm(): void {
    this.stemNode?.port.postMessage({ type: 'rhythm-pulse' })
  }

  async stop(): Promise<void> {
    window.clearInterval(this.rnnoiseTimer)
    this.rnnoiseTimer = 0
    this.rnnoiseProbe?.destroy()
    this.rnnoiseProbe = null
    this.toneClock?.dispose()
    this.toneClock = null

    for (const node of this.demoNodes) {
      try {
        node.stop()
      } catch {
        // Already stopped.
      }
    }
    this.demoNodes = []

    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null

    this.stemNode?.port.close()
    this.stemNode?.disconnect()
    this.source?.disconnect()
    this.preAnalyser?.disconnect()
    this.outputAnalyser?.disconnect()
    this.outputGain?.disconnect()

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close()
    }

    this.audioContext = null
    this.source = null
    this.stemNode = null
    this.preAnalyser = null
    this.outputAnalyser = null
    this.outputGain = null
    this.setStatus({ ...initialStatus })
  }

  private async createContext(): Promise<AudioContext> {
    const context = new AudioContext({ latencyHint: 'interactive' })
    this.audioContext = context
    this.setStatus({
      audioContext: context.state,
      latencyMs: Math.round(context.baseLatency * 1000),
    })

    if (context.state === 'suspended') {
      await context.resume()
      this.setStatus({ audioContext: context.state })
    }

    await context.audioWorklet.addModule(`${import.meta.env.BASE_URL}worklets/stem-processor.js`)
    this.setStatus({ worklet: 'ready' })
    return context
  }

  private async connectSource(
    context: AudioContext,
    source: AudioNode,
    mixer: MixerState,
  ): Promise<void> {
    this.preAnalyser = context.createAnalyser()
    this.preAnalyser.fftSize = 1024
    this.preAnalyser.smoothingTimeConstant = 0.72

    this.outputAnalyser = context.createAnalyser()
    this.outputAnalyser.fftSize = 2048
    this.outputAnalyser.smoothingTimeConstant = 0.78

    this.outputGain = context.createGain()
    this.outputGain.gain.value = 1

    this.stemNode = new AudioWorkletNode(context, 'world-demucs-stem-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: {
        sampleRate: context.sampleRate,
      },
    })

    this.stemNode.port.onmessage = (event: MessageEvent<StemMeters>) => {
      this.dispatchEvent(new CustomEvent<StemMeters>('meters', { detail: event.data }))
    }

    source.connect(this.preAnalyser)
    source.connect(this.stemNode)
    this.stemNode.connect(this.outputAnalyser)
    this.outputAnalyser.connect(this.outputGain)
    this.outputGain.connect(context.destination)
    this.updateMixer(mixer)
    this.setStatus({ audioContext: context.state, worklet: 'ready' })
    this.dispatchEvent(new CustomEvent('ready'))
  }

  private startRnnoiseLoop(): void {
    window.clearInterval(this.rnnoiseTimer)
    if (!this.rnnoiseProbe || !this.preAnalyser || !this.stemNode) return

    const frame = new Float32Array(this.rnnoiseProbe.frameSize)
    const analyserBuffer = new Float32Array(this.preAnalyser.fftSize)

    this.rnnoiseTimer = window.setInterval(() => {
      if (!this.rnnoiseProbe || !this.preAnalyser || !this.stemNode) return
      this.preAnalyser.getFloatTimeDomainData(analyserBuffer)
      frame.fill(0)
      frame.set(analyserBuffer.subarray(0, Math.min(frame.length, analyserBuffer.length)))
      const vad = this.rnnoiseProbe.process(frame)
      this.stemNode.port.postMessage({ type: 'voice-bias', value: vad })
      this.setStatus({ rnnoiseVad: vad })
    }, 80)
  }

  private createNoiseSource(context: AudioContext): AudioBufferSourceNode {
    const length = context.sampleRate * 2
    const buffer = context.createBuffer(1, length, context.sampleRate)
    const channel = buffer.getChannelData(0)

    for (let index = 0; index < channel.length; index += 1) {
      const rumble = Math.sin(index * 0.004) * 0.12
      channel[index] = (Math.random() * 2 - 1) * 0.22 + rumble
    }

    const source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    return source
  }

  private setStatus(next: Partial<EngineStatus>): void {
    this.status = { ...this.status, ...next }
    this.dispatchEvent(new CustomEvent<EngineStatus>('status', { detail: this.getStatus() }))
  }
}
