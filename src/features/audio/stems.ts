export const stemIds = ['vocals', 'percussion', 'melody', 'residue'] as const

export type StemId = (typeof stemIds)[number]

export interface StemControl {
  gain: number
  muted: boolean
  solo: boolean
  inverted: boolean
}

export interface MixerState {
  masterGain: number
  wet: number
  bpm: number
  rhythmDepth: number
  rhythmEnabled: boolean
  rnnoiseEnabled: boolean
  onnxEnabled: boolean
  presetId: string
  stems: Record<StemId, StemControl>
}

export interface MixerPreset {
  id: string
  label: string
  settings: Partial<Omit<MixerState, 'stems' | 'presetId'>> & {
    stems: Partial<Record<StemId, Partial<StemControl>>>
  }
}

export interface WorkletMixerState {
  masterGain: number
  wet: number
  bpm: number
  rhythmDepth: number
  rhythmEnabled: boolean
  stems: Record<StemId, StemControl>
}

const defaultStem = (gain: number): StemControl => ({
  gain,
  muted: false,
  solo: false,
  inverted: false,
})

export const defaultMixerState: MixerState = {
  masterGain: 0.82,
  wet: 0.92,
  bpm: 92,
  rhythmDepth: 0.16,
  rhythmEnabled: false,
  rnnoiseEnabled: true,
  onnxEnabled: false,
  presetId: 'balanced',
  stems: {
    vocals: defaultStem(0.84),
    percussion: defaultStem(0.52),
    melody: defaultStem(0.58),
    residue: defaultStem(0.48),
  },
}

export const mixerPresets: MixerPreset[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    settings: {
      masterGain: 0.82,
      wet: 0.92,
      rhythmEnabled: false,
      rhythmDepth: 0.16,
      stems: {
        vocals: { gain: 0.84, muted: false, inverted: false },
        percussion: { gain: 0.52, muted: false, inverted: false },
        melody: { gain: 0.58, muted: false, inverted: false },
        residue: { gain: 0.48, muted: false, inverted: false },
      },
    },
  },
  {
    id: 'mute-traffic',
    label: 'Mute Traffic',
    settings: {
      masterGain: 0.9,
      wet: 1,
      rhythmEnabled: false,
      stems: {
        vocals: { gain: 0.95, muted: false },
        percussion: { gain: 0.3, muted: false },
        melody: { gain: 0.72, muted: false },
        residue: { gain: 0.08, muted: true },
      },
    },
  },
  {
    id: 'conversation-bed',
    label: 'Conversation Bed',
    settings: {
      masterGain: 0.76,
      wet: 1,
      bpm: 96,
      rhythmDepth: 0.42,
      rhythmEnabled: true,
      stems: {
        vocals: { gain: 0.42, muted: false },
        percussion: { gain: 1, muted: false },
        melody: { gain: 0.18, muted: false },
        residue: { gain: 0, muted: true },
      },
    },
  },
  {
    id: 'invert-reality',
    label: 'Invert Reality',
    settings: {
      masterGain: 0.78,
      wet: 1,
      rhythmEnabled: true,
      rhythmDepth: 0.28,
      stems: {
        vocals: { gain: 0.72, muted: false, inverted: true },
        percussion: { gain: 0.58, muted: false },
        melody: { gain: 0.64, muted: false, inverted: true },
        residue: { gain: 0.78, muted: false },
      },
    },
  },
  {
    id: 'clean-residue',
    label: 'Clean Residue',
    settings: {
      masterGain: 0.86,
      wet: 1,
      rhythmEnabled: false,
      stems: {
        vocals: { gain: 0.2, muted: true },
        percussion: { gain: 0.1, muted: true },
        melody: { gain: 0.18, muted: false },
        residue: { gain: 0.88, muted: false },
      },
    },
  },
]

export function cloneMixerState(state: MixerState = defaultMixerState): MixerState {
  return {
    ...state,
    stems: stemIds.reduce(
      (next, id) => {
        next[id] = { ...state.stems[id] }
        return next
      },
      {} as Record<StemId, StemControl>,
    ),
  }
}

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function applyPreset(state: MixerState, presetId: string): MixerState {
  const preset = mixerPresets.find((item) => item.id === presetId)
  if (!preset) return state

  const next = cloneMixerState(state)
  next.presetId = preset.id
  next.masterGain = clampUnit(preset.settings.masterGain ?? next.masterGain)
  next.wet = clampUnit(preset.settings.wet ?? next.wet)
  next.bpm = preset.settings.bpm ?? next.bpm
  next.rhythmDepth = clampUnit(preset.settings.rhythmDepth ?? next.rhythmDepth)
  next.rhythmEnabled = preset.settings.rhythmEnabled ?? next.rhythmEnabled
  next.rnnoiseEnabled = preset.settings.rnnoiseEnabled ?? next.rnnoiseEnabled
  next.onnxEnabled = preset.settings.onnxEnabled ?? next.onnxEnabled

  for (const id of stemIds) {
    next.stems[id] = {
      ...next.stems[id],
      ...preset.settings.stems[id],
      gain: clampUnit(preset.settings.stems[id]?.gain ?? next.stems[id].gain),
      solo: false,
    }
  }

  return next
}

export function toWorkletMixerState(state: MixerState): WorkletMixerState {
  return {
    masterGain: clampUnit(state.masterGain),
    wet: clampUnit(state.wet),
    bpm: Math.min(180, Math.max(40, state.bpm)),
    rhythmDepth: clampUnit(state.rhythmDepth),
    rhythmEnabled: state.rhythmEnabled,
    stems: stemIds.reduce(
      (next, id) => {
        next[id] = {
          ...state.stems[id],
          gain: clampUnit(state.stems[id].gain),
        }
        return next
      },
      {} as Record<StemId, StemControl>,
    ),
  }
}
