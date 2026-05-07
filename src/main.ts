import {
  Activity,
  Cpu,
  ExternalLink,
  Heart,
  Headphones,
  Mic,
  Music2,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Square,
  Star,
  Volume2,
  VolumeX,
  Wand2,
  Waves,
  Zap,
  createIcons,
} from 'lucide'
import './style.css'
import { WorldDemucsEngine, type EngineStatus, type StemMeters } from './features/audio/audioEngine'
import { loadModelManifest, getDefaultModel, type ModelEntry } from './features/audio/modelManifest'
import {
  applyPreset,
  cloneMixerState,
  defaultMixerState,
  mixerPresets,
  stemIds,
  type MixerState,
  type StemId,
} from './features/audio/stems'
import { clearMixerState, loadMixerState, saveMixerState } from './features/audio/storage'
import {
  createOnnxDemucsAdapter,
  createRnnoiseProbe,
  createToneClock,
} from './features/audio/processingStack'
import { Visualizer } from './features/audio/visualizer'
import { buildInfo } from './features/system/buildInfo'
import { fetchLatestCommit, type LatestCommit } from './features/system/github'

type StackState = 'idle' | 'loading' | 'ready' | 'off' | 'error' | 'unavailable'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('App root is missing')
const appRoot = app

const engine = new WorldDemucsEngine()
let mixer: MixerState = cloneMixerState(loadMixerState())
let visualizer: Visualizer | null = null
let engineStatus: EngineStatus = engine.getStatus()
let meters: StemMeters = {
  input: 0,
  output: 0,
  stems: {
    vocals: 0,
    percussion: 0,
    melody: 0,
    residue: 0,
  },
}
let latestCommit: LatestCommit | null = null
let rnnoiseState: StackState = mixer.rnnoiseEnabled ? 'idle' : 'off'
let toneState: StackState = 'idle'
let onnxState: StackState = 'idle'
let manifestState: StackState = 'idle'
let selectedModel: ModelEntry | null = null
let onnxDetails = 'Adapter not loaded'
let notice = ''
let noticeTimer = 0
let busyAction: string | null = null

render()
void boot()

engine.addEventListener('status', (event) => {
  engineStatus = (event as CustomEvent<EngineStatus>).detail
  syncUi()
})

engine.addEventListener('meters', (event) => {
  meters = (event as CustomEvent<StemMeters>).detail
  visualizer?.setMeters(meters)
  syncMeters()
})

window.addEventListener('error', () =>
  showNotice('Unexpected app error. Reload and try the demo path.', true),
)
window.addEventListener('unhandledrejection', () =>
  showNotice('Unexpected async error. Reload and try the demo path.', true),
)

function render(): void {
  appRoot.innerHTML = `
    <div class="app-frame">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark"><i data-lucide="waves"></i></span>
          <div>
            <h1>World-Demucs</h1>
            <p>Reality mixer</p>
          </div>
        </div>
        <nav class="toplinks" aria-label="Project links">
          <a class="tool-link tool-link--primary" href="${buildInfo.repoUrl}" target="_blank" rel="noreferrer">
            <i data-lucide="star"></i><span>Star on GitHub</span>
          </a>
          <a class="icon-link" href="${buildInfo.paypalUrl}" target="_blank" rel="noreferrer" aria-label="Support on PayPal" title="Support on PayPal">
            <i data-lucide="heart"></i>
          </a>
          <a class="icon-link" href="${buildInfo.repoUrl}" target="_blank" rel="noreferrer" aria-label="Open repository" title="Open repository">
            <i data-lucide="external-link"></i>
          </a>
        </nav>
      </header>

      <main class="console-grid">
        <section class="scope-panel" aria-label="Live audio monitor">
          <div class="panel-head">
            <div>
              <p class="section-kicker">Environment unmixing</p>
              <h2>Vocals · Percussion · Melody · Residue</h2>
            </div>
            <div class="chip-row">
              <span class="chip" data-status="mode">Idle</span>
              <span class="chip" data-status="worklet">Worklet idle</span>
              <span class="chip" data-status="latency">0 ms</span>
            </div>
          </div>
          <canvas id="visualizer" class="visualizer" width="1200" height="520" aria-label="Live waveform and stem levels"></canvas>
          <div class="transport" aria-label="Audio transport">
            <button class="command command--primary" type="button" data-action="start-mic">
              <i data-lucide="mic"></i><span>Start Mic</span>
            </button>
            <button class="command" type="button" data-action="start-demo">
              <i data-lucide="play"></i><span>Demo</span>
            </button>
            <button class="command" type="button" data-action="stop">
              <i data-lucide="square"></i><span>Stop</span>
            </button>
            <button class="command" type="button" data-action="probe-stack">
              <i data-lucide="cpu"></i><span>Probe Stack</span>
            </button>
          </div>
        </section>

        <section class="status-grid" aria-label="System status">
          ${statusTile('Microphone', 'mic-state', 'Idle', 'mic')}
          ${statusTile('RNNoise', 'rnnoise-state', 'Idle', 'radio')}
          ${statusTile('Tone.js', 'tone-state', 'Idle', 'music-2')}
          ${statusTile('ONNX', 'onnx-state', 'Idle', 'cpu')}
          ${statusTile('VAD', 'vad-state', '0%', 'activity')}
          ${statusTile('Output', 'output-state', '0%', 'volume-2')}
        </section>

        <section class="mixer-panel" aria-label="Stem mixer">
          <div class="panel-head">
            <div>
              <p class="section-kicker">Surgical mix</p>
              <h2>Stem controls</h2>
            </div>
            <button class="icon-command" type="button" data-action="reset" aria-label="Reset mixer" title="Reset mixer">
              <i data-lucide="rotate-ccw"></i>
            </button>
          </div>

          <div class="global-controls">
            ${rangeControl('Master', 'masterGain', mixer.masterGain, 'volume-2')}
            ${rangeControl('Wet', 'wet', mixer.wet, 'sliders-horizontal')}
            ${numberControl('BPM', 'bpm', mixer.bpm, 'zap')}
            ${rangeControl('Rhythm', 'rhythmDepth', mixer.rhythmDepth, 'activity')}
          </div>

          <div class="toggle-row">
            <button class="toggle" type="button" data-action="toggle-rhythm"><i data-lucide="activity"></i><span>Rhythm</span></button>
            <button class="toggle" type="button" data-action="toggle-rnnoise"><i data-lucide="radio"></i><span>RNNoise</span></button>
            <button class="toggle" type="button" data-action="toggle-onnx"><i data-lucide="cpu"></i><span>ONNX</span></button>
          </div>

          <div class="stem-list">
            ${stemIds.map((id) => stemStrip(id)).join('')}
          </div>
        </section>

        <section class="preset-panel" aria-label="Presets">
          <div class="panel-head">
            <div>
              <p class="section-kicker">Scenes</p>
              <h2>Presets</h2>
            </div>
            <i class="panel-icon" data-lucide="wand-2"></i>
          </div>
          <div class="preset-grid">
            ${mixerPresets
              .map(
                (preset) =>
                  `<button class="preset" type="button" data-preset="${preset.id}">${preset.label}</button>`,
              )
              .join('')}
          </div>
        </section>

        <section class="model-panel" aria-label="Model adapter">
          <div class="panel-head">
            <div>
              <p class="section-kicker">Demucs via ONNX</p>
              <h2>Model adapter</h2>
            </div>
            <i class="panel-icon" data-lucide="cpu"></i>
          </div>
          <div class="model-row">
            <select id="model-select" aria-label="ONNX model"></select>
            <button class="command" type="button" data-action="load-onnx">
              <i data-lucide="refresh-cw"></i><span>Load</span>
            </button>
          </div>
          <p class="model-meta" data-field="model-meta">Manifest pending</p>
          <p class="model-meta" data-field="onnx-details">${onnxDetails}</p>
        </section>
      </main>

      <footer class="build-footer">
        <span>Version <strong data-field="version">${buildInfo.version}</strong></span>
        <span>Build <strong data-field="build-commit">${buildInfo.commit}</strong></span>
        <span>Latest <a data-field="latest-commit" href="${buildInfo.repoUrl}/commits/main" target="_blank" rel="noreferrer">checking</a></span>
        <a href="${buildInfo.repoUrl}" target="_blank" rel="noreferrer">https://github.com/baditaflorin/world-demucs</a>
        <a href="${buildInfo.paypalUrl}" target="_blank" rel="noreferrer">https://www.paypal.com/paypalme/florinbadita</a>
      </footer>
    </div>

    <div class="toast" role="status" aria-live="polite" data-field="notice">${notice}</div>
  `

  createIcons({
    icons: {
      Activity,
      Cpu,
      ExternalLink,
      Heart,
      Headphones,
      Mic,
      Music2,
      Play,
      Radio,
      RefreshCw,
      RotateCcw,
      SlidersHorizontal,
      Square,
      Star,
      Volume2,
      VolumeX,
      Wand2,
      Waves,
      Zap,
    },
  })

  const canvas = document.querySelector<HTMLCanvasElement>('#visualizer')
  if (canvas) {
    visualizer = new Visualizer(canvas)
    visualizer.start()
  }

  appRoot.addEventListener('click', handleClick)
  appRoot.addEventListener('input', handleInput)
  syncUi()
}

async function boot(): Promise<void> {
  await Promise.allSettled([loadManifest(), loadLatestCommit(), registerServiceWorker()])
  syncUi()
}

function statusTile(label: string, field: string, value: string, icon: string): string {
  return `
    <div class="status-tile">
      <span><i data-lucide="${icon}"></i>${label}</span>
      <strong data-field="${field}">${value}</strong>
    </div>
  `
}

function rangeControl(label: string, key: keyof MixerState, value: number, icon: string): string {
  return `
    <label class="range-control">
      <span><i data-lucide="${icon}"></i>${label}</span>
      <input type="range" min="0" max="1" step="0.01" value="${value}" data-global="${key}" />
      <output data-output="${key}">${formatPercent(value)}</output>
    </label>
  `
}

function numberControl(label: string, key: keyof MixerState, value: number, icon: string): string {
  return `
    <label class="range-control">
      <span><i data-lucide="${icon}"></i>${label}</span>
      <input type="number" min="40" max="180" step="1" value="${value}" data-global="${key}" />
      <output data-output="${key}">${Math.round(value)}</output>
    </label>
  `
}

function stemStrip(id: StemId): string {
  const stem = mixer.stems[id]
  return `
    <article class="stem-strip" data-stem-row="${id}">
      <div class="stem-title">
        <span>${stemLabel(id)}</span>
        <meter min="0" max="1" value="0" data-meter="${id}"></meter>
      </div>
      <label class="stem-gain">
        <span>Gain</span>
        <input type="range" min="0" max="1" step="0.01" value="${stem.gain}" data-stem="${id}" data-stem-field="gain" />
        <output data-stem-output="${id}">${formatPercent(stem.gain)}</output>
      </label>
      <div class="stem-actions">
        <button class="mini-command" type="button" data-stem="${id}" data-stem-action="mute" aria-label="Mute ${stemLabel(id)}" title="Mute">
          <i data-lucide="volume-x"></i>
        </button>
        <button class="mini-command" type="button" data-stem="${id}" data-stem-action="solo" aria-label="Solo ${stemLabel(id)}" title="Solo">
          <i data-lucide="headphones"></i>
        </button>
        <button class="mini-command" type="button" data-stem="${id}" data-stem-action="invert" aria-label="Invert ${stemLabel(id)}" title="Invert">
          <i data-lucide="refresh-cw"></i>
        </button>
      </div>
    </article>
  `
}

async function handleClick(event: Event): Promise<void> {
  const target = event.target as HTMLElement
  const actionButton = target.closest<HTMLElement>('[data-action]')
  const presetButton = target.closest<HTMLElement>('[data-preset]')
  const stemButton = target.closest<HTMLElement>('[data-stem-action]')

  if (presetButton?.dataset.preset) {
    updateMixer(applyPreset(mixer, presetButton.dataset.preset))
    return
  }

  if (stemButton?.dataset.stemAction && stemButton.dataset.stem) {
    const stem = stemButton.dataset.stem as StemId
    const action = stemButton.dataset.stemAction
    const next = cloneMixerState(mixer)
    if (action === 'mute') next.stems[stem].muted = !next.stems[stem].muted
    if (action === 'solo') next.stems[stem].solo = !next.stems[stem].solo
    if (action === 'invert') next.stems[stem].inverted = !next.stems[stem].inverted
    next.presetId = 'custom'
    updateMixer(next)
    return
  }

  if (!actionButton?.dataset.action) return
  const action = actionButton.dataset.action

  try {
    if (action === 'start-mic') await runBusy(action, () => startAudio('microphone'))
    if (action === 'start-demo') await runBusy(action, () => startAudio('demo'))
    if (action === 'stop') await runBusy(action, stopAudio)
    if (action === 'probe-stack') await runBusy(action, probeStack)
    if (action === 'load-onnx') await runBusy(action, loadOnnxModel)
    if (action === 'reset') resetMixer()
    if (action === 'toggle-rhythm') updateMixer({ ...mixer, rhythmEnabled: !mixer.rhythmEnabled })
    if (action === 'toggle-rnnoise') {
      updateMixer({ ...mixer, rnnoiseEnabled: !mixer.rnnoiseEnabled })
      rnnoiseState = mixer.rnnoiseEnabled ? 'idle' : 'off'
    }
    if (action === 'toggle-onnx') {
      updateMixer({ ...mixer, onnxEnabled: !mixer.onnxEnabled })
      onnxState = mixer.onnxEnabled ? onnxState : 'off'
    }
  } catch (error) {
    showNotice(error instanceof Error ? error.message : 'Action failed', true)
  } finally {
    syncUi()
  }
}

function handleInput(event: Event): void {
  const input = event.target as HTMLInputElement
  if (!(input instanceof HTMLInputElement)) return

  const globalKey = input.dataset.global as keyof MixerState | undefined
  if (globalKey) {
    const next = cloneMixerState(mixer)
    const value = input.type === 'number' ? Number(input.value) : Number(input.value)
    if (globalKey === 'bpm') next.bpm = Math.min(180, Math.max(40, value))
    if (globalKey === 'masterGain') next.masterGain = value
    if (globalKey === 'wet') next.wet = value
    if (globalKey === 'rhythmDepth') next.rhythmDepth = value
    next.presetId = 'custom'
    updateMixer(next)
    return
  }

  if (input.dataset.stem && input.dataset.stemField === 'gain') {
    const stem = input.dataset.stem as StemId
    const next = cloneMixerState(mixer)
    next.stems[stem].gain = Number(input.value)
    next.presetId = 'custom'
    updateMixer(next)
  }
}

async function startAudio(mode: 'microphone' | 'demo'): Promise<void> {
  showNotice(mode === 'microphone' ? 'Requesting microphone' : 'Starting demo input')
  if (mode === 'microphone') await engine.startMicrophone(mixer)
  else await engine.startDemo(mixer)

  visualizer?.setAnalyser(engine.getOutputAnalyser())
  await loadRealtimeStack()
  showNotice(mode === 'microphone' ? 'Microphone running locally' : 'Demo running locally')
}

async function stopAudio(): Promise<void> {
  await engine.stop()
  visualizer?.setAnalyser(null)
  rnnoiseState = mixer.rnnoiseEnabled ? 'idle' : 'off'
  toneState = 'idle'
  showNotice('Stopped')
}

async function loadRealtimeStack(): Promise<void> {
  toneState = 'loading'
  rnnoiseState = mixer.rnnoiseEnabled ? 'loading' : 'off'
  syncUi()

  const toneTask = createToneClock(mixer.bpm, () => engine.pulseRhythm())
  const rnnoiseTask = mixer.rnnoiseEnabled ? createRnnoiseProbe() : Promise.resolve(null)
  const [toneResult, rnnoiseResult] = await Promise.allSettled([toneTask, rnnoiseTask])

  if (toneResult.status === 'fulfilled') {
    engine.attachToneClock(toneResult.value)
    toneState = 'ready'
  } else {
    toneState = 'error'
  }

  if (rnnoiseResult.status === 'fulfilled' && rnnoiseResult.value) {
    engine.attachRnnoiseProbe(rnnoiseResult.value)
    rnnoiseState = 'ready'
  } else if (mixer.rnnoiseEnabled) {
    rnnoiseState = 'error'
  }
}

async function probeStack(): Promise<void> {
  showNotice('Probing local WASM stack')
  rnnoiseState = 'loading'
  toneState = 'loading'
  onnxState = 'loading'
  syncUi()

  const rnnoise = await createRnnoiseProbe()
  rnnoise.destroy()
  const tone = await createToneClock(mixer.bpm, () => {})
  tone.dispose()
  const onnx = await createOnnxDemucsAdapter(null)
  await onnx.dispose()

  rnnoiseState = mixer.rnnoiseEnabled ? 'ready' : 'off'
  toneState = 'ready'
  onnxState = 'unavailable'
  onnxDetails = 'ONNX Runtime Web loaded; no bundled neural weights active'
  showNotice('Local stack ready')
}

async function loadOnnxModel(): Promise<void> {
  if (!selectedModel) await loadManifest()
  if (!selectedModel) throw new Error('No model selected')

  onnxState = 'loading'
  onnxDetails = `Loading ${selectedModel.label}`
  syncUi()

  const adapter = await createOnnxDemucsAdapter(selectedModel.url)
  if (adapter.status === 'unavailable') {
    onnxState = 'unavailable'
    onnxDetails = 'No ONNX model URL for this entry; using live proxy path'
  } else {
    onnxState = 'ready'
    onnxDetails = `Inputs: ${adapter.inputNames.join(', ')} · Outputs: ${adapter.outputNames.join(', ')}`
  }
  await adapter.dispose()
  showNotice(onnxState === 'ready' ? 'ONNX model adapter ready' : 'ONNX adapter unavailable')
}

async function loadManifest(): Promise<void> {
  manifestState = 'loading'
  const manifest = await loadModelManifest()
  selectedModel = getDefaultModel(manifest)
  manifestState = 'ready'

  const select = document.querySelector<HTMLSelectElement>('#model-select')
  if (select) {
    select.innerHTML = manifest.models
      .map((model) => `<option value="${model.id}">${model.label}</option>`)
      .join('')
    select.value = selectedModel.id
    select.addEventListener('change', () => {
      selectedModel = manifest.models.find((model) => model.id === select.value) ?? selectedModel
      syncUi()
    })
  }
}

async function loadLatestCommit(): Promise<void> {
  latestCommit = await fetchLatestCommit()
}

function resetMixer(): void {
  mixer = cloneMixerState(defaultMixerState)
  clearMixerState()
  engine.updateMixer(mixer)
  rnnoiseState = mixer.rnnoiseEnabled ? 'idle' : 'off'
  showNotice('Mixer reset')
  syncUi()
}

function updateMixer(next: MixerState): void {
  mixer = cloneMixerState(next)
  saveMixerState(mixer)
  engine.updateMixer(mixer)
  syncUi()
}

async function runBusy(action: string, task: () => Promise<void>): Promise<void> {
  busyAction = action
  syncUi()
  try {
    await task()
  } finally {
    busyAction = null
    syncUi()
  }
}

function syncUi(): void {
  setText('[data-status="mode"]', modeLabel(engineStatus.mode))
  setText('[data-status="worklet"]', `Worklet ${engineStatus.worklet}`)
  setText('[data-status="latency"]', `${engineStatus.latencyMs} ms`)
  setText('[data-field="mic-state"]', engineStatus.microphone)
  setText('[data-field="rnnoise-state"]', rnnoiseState)
  setText('[data-field="tone-state"]', toneState)
  setText('[data-field="onnx-state"]', onnxState)
  setText('[data-field="vad-state"]', formatPercent(engineStatus.rnnoiseVad))
  setText('[data-field="output-state"]', formatPercent(Math.min(1, meters.output * 2.5)))
  setText('[data-field="notice"]', notice)
  document.querySelector('[data-field="notice"]')?.classList.toggle('is-visible', notice.length > 0)
  setText('[data-output="masterGain"]', formatPercent(mixer.masterGain))
  setText('[data-output="wet"]', formatPercent(mixer.wet))
  setText('[data-output="bpm"]', String(Math.round(mixer.bpm)))
  setText('[data-output="rhythmDepth"]', formatPercent(mixer.rhythmDepth))
  setText('[data-field="onnx-details"]', onnxDetails)
  setText(
    '[data-field="model-meta"]',
    selectedModel ? modelMeta(selectedModel) : `Manifest ${manifestState}`,
  )

  const latest = document.querySelector<HTMLAnchorElement>('[data-field="latest-commit"]')
  if (latestCommit && latest) {
    latest.textContent = latestCommit.shortSha
    latest.href = latestCommit.url
  }

  for (const key of ['masterGain', 'wet', 'bpm', 'rhythmDepth'] as const) {
    const input = document.querySelector<HTMLInputElement>(`[data-global="${key}"]`)
    if (input && document.activeElement !== input) input.value = String(mixer[key])
  }

  for (const preset of mixerPresets) {
    document
      .querySelector(`[data-preset="${preset.id}"]`)
      ?.classList.toggle('is-active', mixer.presetId === preset.id)
  }

  for (const id of stemIds) {
    const stem = mixer.stems[id]
    const row = document.querySelector(`[data-stem-row="${id}"]`)
    row?.classList.toggle('is-muted', stem.muted)
    row?.classList.toggle('is-solo', stem.solo)
    row?.classList.toggle('is-inverted', stem.inverted)
    const input = document.querySelector<HTMLInputElement>(
      `[data-stem="${id}"][data-stem-field="gain"]`,
    )
    if (input && document.activeElement !== input) input.value = String(stem.gain)
    setText(`[data-stem-output="${id}"]`, formatPercent(stem.gain))
  }

  document
    .querySelector('[data-action="toggle-rhythm"]')
    ?.classList.toggle('is-active', mixer.rhythmEnabled)
  document
    .querySelector('[data-action="toggle-rnnoise"]')
    ?.classList.toggle('is-active', mixer.rnnoiseEnabled)
  document
    .querySelector('[data-action="toggle-onnx"]')
    ?.classList.toggle('is-active', mixer.onnxEnabled)

  document.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
    button.disabled = Boolean(busyAction && busyAction !== button.dataset.action)
    button.classList.toggle('is-busy', busyAction === button.dataset.action)
  })

  syncMeters()
}

function syncMeters(): void {
  for (const id of stemIds) {
    const meter = document.querySelector<HTMLMeterElement>(`[data-meter="${id}"]`)
    if (meter) meter.value = Math.min(1, meters.stems[id] * 3.4)
  }
}

function setText(selector: string, value: string): void {
  const node = document.querySelector(selector)
  if (node) node.textContent = value
}

function showNotice(message: string, isError = false): void {
  notice = message
  window.clearTimeout(noticeTimer)
  const toast = document.querySelector('[data-field="notice"]')
  toast?.classList.toggle('is-error', isError)
  toast?.classList.toggle('is-visible', true)
  noticeTimer = window.setTimeout(() => {
    notice = ''
    syncUi()
  }, 4200)
  syncUi()
}

function modeLabel(mode: EngineStatus['mode']): string {
  if (mode === 'microphone') return 'Mic live'
  if (mode === 'demo') return 'Demo live'
  return 'Idle'
}

function formatPercent(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`
}

function stemLabel(id: StemId): string {
  return id[0].toUpperCase() + id.slice(1)
}

function modelMeta(model: ModelEntry): string {
  return `${model.status} · ${model.sampleRate} Hz · ${model.license}`
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return
  await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
    scope: import.meta.env.BASE_URL,
  })
}
