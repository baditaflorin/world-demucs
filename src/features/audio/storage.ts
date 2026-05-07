import { z } from 'zod'
import { defaultMixerState, stemIds, type MixerState } from './stems'

const stemSchema = z.object({
  gain: z.number().min(0).max(1),
  muted: z.boolean(),
  solo: z.boolean(),
  inverted: z.boolean(),
})

const mixerSchema: z.ZodType<MixerState> = z.object({
  masterGain: z.number().min(0).max(1),
  wet: z.number().min(0).max(1),
  bpm: z.number().min(40).max(180),
  rhythmDepth: z.number().min(0).max(1),
  rhythmEnabled: z.boolean(),
  rnnoiseEnabled: z.boolean(),
  onnxEnabled: z.boolean(),
  presetId: z.string(),
  stems: z.object({
    vocals: stemSchema,
    percussion: stemSchema,
    melody: stemSchema,
    residue: stemSchema,
  }),
})

const storageKey = 'world-demucs:mixer:v1'

export function loadMixerState(): MixerState {
  const raw = globalThis.localStorage?.getItem(storageKey)
  if (!raw) return defaultMixerState

  try {
    const parsed = mixerSchema.parse(JSON.parse(raw))
    for (const id of stemIds) {
      parsed.stems[id].solo = false
    }
    return parsed
  } catch {
    return defaultMixerState
  }
}

export function saveMixerState(state: MixerState): void {
  globalThis.localStorage?.setItem(storageKey, JSON.stringify(state))
}

export function clearMixerState(): void {
  globalThis.localStorage?.removeItem(storageKey)
}
