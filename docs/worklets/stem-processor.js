/* global AudioWorkletProcessor, registerProcessor, sampleRate, structuredClone */

const stemIds = ['vocals', 'percussion', 'melody', 'residue']

const defaultStem = (gain) => ({
  gain,
  muted: false,
  solo: false,
  inverted: false,
})

const defaultMixer = {
  masterGain: 0.82,
  wet: 0.92,
  bpm: 92,
  rhythmDepth: 0.16,
  rhythmEnabled: false,
  stems: {
    vocals: defaultStem(0.84),
    percussion: defaultStem(0.52),
    melody: defaultStem(0.58),
    residue: defaultStem(0.48),
  },
}

class OnePoleLowPass {
  constructor(sampleRate, frequency) {
    this.z = 0
    this.set(sampleRate, frequency)
  }

  set(sampleRate, frequency) {
    this.alpha = 1 - Math.exp((-2 * Math.PI * frequency) / sampleRate)
  }

  process(input) {
    this.z += this.alpha * (input - this.z)
    return this.z
  }
}

class OnePoleHighPass {
  constructor(sampleRate, frequency) {
    this.low = new OnePoleLowPass(sampleRate, frequency)
  }

  process(input) {
    return input - this.low.process(input)
  }
}

class StemProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const sampleRateOption = options.processorOptions?.sampleRate || sampleRate
    this.mixer = structuredClone(defaultMixer)
    this.voiceBias = 0
    this.rhythmPulse = 0
    this.rhythmPhase = 0
    this.previousAbs = 0
    this.energy = 0
    this.frameCount = 0
    this.sums = this.emptySums()

    this.filters = {
      residue: new OnePoleLowPass(sampleRateOption, 260),
      vocalHigh: new OnePoleHighPass(sampleRateOption, 180),
      vocalLow: new OnePoleLowPass(sampleRateOption, 3600),
      melodyHigh: new OnePoleHighPass(sampleRateOption, 430),
      melodyLow: new OnePoleLowPass(sampleRateOption, 5200),
      percussionHigh: new OnePoleHighPass(sampleRateOption, 1800),
      air: new OnePoleHighPass(sampleRateOption, 5200),
    }

    this.port.onmessage = (event) => {
      if (event.data?.type === 'mixer') {
        this.mixer = event.data.mixer
      }
      if (event.data?.type === 'voice-bias') {
        this.voiceBias = Math.max(0, Math.min(1, Number(event.data.value) || 0))
      }
      if (event.data?.type === 'rhythm-pulse') {
        this.rhythmPulse = 1
      }
    }
  }

  process(inputs, outputs) {
    const input = inputs[0]
    const output = outputs[0]
    const left = output[0]
    const right = output[1] || output[0]

    if (!input.length || !input[0]) {
      left.fill(0)
      right.fill(0)
      return true
    }

    const inputLeft = input[0]
    const inputRight = input[1] || input[0]
    const hasSolo = stemIds.some((id) => this.mixer.stems[id]?.solo)
    const rhythmIncrement = this.mixer.bpm / 60 / sampleRate

    for (let index = 0; index < left.length; index += 1) {
      const dry = (inputLeft[index] + inputRight[index]) * 0.5
      const stems = this.separate(dry)
      const rhythmGate = this.rhythmGate(rhythmIncrement)
      let wet = 0

      for (const id of stemIds) {
        const control = this.mixer.stems[id]
        const audible = hasSolo ? control.solo : !control.muted
        const sign = control.inverted ? -1 : 1
        const bed = this.mixer.rhythmEnabled && (id === 'vocals' || id === 'residue') ? rhythmGate : 1
        const sample = audible ? stems[id] * control.gain * sign * bed : 0
        wet += sample
        this.sums[id] += sample * sample
      }

      const mixed = dry * (1 - this.mixer.wet) + wet * this.mixer.wet
      const out = Math.tanh(mixed * this.mixer.masterGain * 1.28)
      left[index] = out
      right[index] = out
      this.sums.input += dry * dry
      this.sums.output += out * out
      this.frameCount += 1
    }

    if (this.frameCount >= 2048) {
      this.postMeters()
    }

    return true
  }

  separate(input) {
    const abs = Math.abs(input)
    this.energy = this.energy * 0.988 + abs * 0.012
    const flux = Math.max(0, abs - this.previousAbs * 0.94)
    this.previousAbs = abs

    const residue = this.filters.residue.process(input)
    const vocalBand = this.filters.vocalLow.process(this.filters.vocalHigh.process(input))
    const melodyBand = this.filters.melodyLow.process(this.filters.melodyHigh.process(input))
    const transientTone = this.filters.percussionHigh.process(input) + this.filters.air.process(input) * 0.25
    const transientGate = Math.min(1, Math.max(0, flux * 22 + this.energy * 0.22))
    const voiceWeight = 0.58 + this.voiceBias * 0.62

    const vocals = vocalBand * voiceWeight - transientTone * 0.06
    const percussion = transientTone * transientGate * 1.9
    const melody = (melodyBand - vocals * 0.28 - percussion * 0.18) * 0.9
    const background = input - vocals * 0.42 - melody * 0.36 - percussion * 0.48

    return {
      vocals,
      percussion,
      melody,
      residue: background * 0.72 + residue * 0.46,
    }
  }

  rhythmGate(increment) {
    this.rhythmPhase = (this.rhythmPhase + increment) % 1
    const lfo = 0.5 + Math.sin(this.rhythmPhase * Math.PI * 2) * 0.5
    this.rhythmPulse *= 0.9
    const pulse = Math.min(1, this.rhythmPulse)
    const gate = 1 - this.mixer.rhythmDepth + Math.max(lfo, pulse) * this.mixer.rhythmDepth
    return Math.max(0, Math.min(1.5, gate))
  }

  emptySums() {
    return {
      input: 0,
      output: 0,
      vocals: 0,
      percussion: 0,
      melody: 0,
      residue: 0,
    }
  }

  postMeters() {
    const frames = Math.max(1, this.frameCount)
    this.port.postMessage({
      input: Math.sqrt(this.sums.input / frames),
      output: Math.sqrt(this.sums.output / frames),
      stems: {
        vocals: Math.sqrt(this.sums.vocals / frames),
        percussion: Math.sqrt(this.sums.percussion / frames),
        melody: Math.sqrt(this.sums.melody / frames),
        residue: Math.sqrt(this.sums.residue / frames),
      },
    })
    this.sums = this.emptySums()
    this.frameCount = 0
  }
}

registerProcessor('world-demucs-stem-processor', StemProcessor)
