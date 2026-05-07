import type { DenoiseState, Rnnoise } from '@shiguredo/rnnoise-wasm'

export interface RnnoiseProbe {
  frameSize: number
  process(samples: Float32Array): number
  destroy(): void
}

export interface ToneClock {
  setBpm(bpm: number): void
  dispose(): void
}

export interface OnnxDemucsAdapter {
  status: 'ready' | 'unavailable'
  inputNames: string[]
  outputNames: string[]
  modelUrl: string | null
  dispose(): Promise<void>
}

export async function createRnnoiseProbe(): Promise<RnnoiseProbe> {
  const { Rnnoise } = await import('@shiguredo/rnnoise-wasm')
  const rnnoise: Rnnoise = await Rnnoise.load()
  const state: DenoiseState = rnnoise.createDenoiseState()
  const frame = new Float32Array(rnnoise.frameSize)

  return {
    frameSize: rnnoise.frameSize,
    process(samples: Float32Array): number {
      frame.fill(0)
      frame.set(samples.subarray(0, Math.min(samples.length, frame.length)))
      return state.processFrame(frame)
    },
    destroy(): void {
      state.destroy()
    },
  }
}

export async function createToneClock(
  bpm: number,
  onPulse: () => void,
): Promise<ToneClock> {
  const Tone = await import('tone')
  await Tone.start()
  Tone.Transport.bpm.value = bpm

  const loop = new Tone.Loop(() => {
    onPulse()
  }, '8n')

  loop.start(0)
  Tone.Transport.start()

  return {
    setBpm(nextBpm: number): void {
      Tone.Transport.bpm.rampTo(nextBpm, 0.08)
    },
    dispose(): void {
      loop.dispose()
      Tone.Transport.stop()
      Tone.Transport.cancel()
    },
  }
}

export async function createOnnxDemucsAdapter(
  modelUrl: string | null,
): Promise<OnnxDemucsAdapter> {
  const ort = await import('onnxruntime-web')
  ort.env.wasm.numThreads = 1
  ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}onnx/`

  if (!modelUrl) {
    return {
      status: 'unavailable',
      inputNames: [],
      outputNames: [],
      modelUrl: null,
      async dispose() {},
    }
  }

  const session = await ort.InferenceSession.create(modelUrl, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  })

  return {
    status: 'ready',
    inputNames: [...session.inputNames],
    outputNames: [...session.outputNames],
    modelUrl,
    async dispose(): Promise<void> {
      await session.release()
    },
  }
}
