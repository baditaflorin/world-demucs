import { describe, expect, it } from 'vitest'
import { applyPreset, defaultMixerState, toWorkletMixerState } from './stems'

describe('mixer presets', () => {
  it('mutes residue for the traffic preset', () => {
    const mixer = applyPreset(defaultMixerState, 'mute-traffic')

    expect(mixer.stems.residue.muted).toBe(true)
    expect(mixer.stems.vocals.gain).toBeGreaterThan(mixer.stems.residue.gain)
  })

  it('enables rhythmic gating for conversation bed', () => {
    const mixer = applyPreset(defaultMixerState, 'conversation-bed')

    expect(mixer.rhythmEnabled).toBe(true)
    expect(mixer.stems.percussion.gain).toBe(1)
  })

  it('clamps worklet values', () => {
    const mixer = {
      ...defaultMixerState,
      masterGain: 2,
      wet: -1,
      stems: {
        ...defaultMixerState.stems,
        vocals: { ...defaultMixerState.stems.vocals, gain: 8 },
      },
    }

    const worklet = toWorkletMixerState(mixer)

    expect(worklet.masterGain).toBe(1)
    expect(worklet.wet).toBe(0)
    expect(worklet.stems.vocals.gain).toBe(1)
  })
})
