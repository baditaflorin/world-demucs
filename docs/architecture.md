# Architecture

Live site: https://baditaflorin.github.io/world-demucs/

Repository: https://github.com/baditaflorin/world-demucs

## Context

```mermaid
C4Context
  title World-Demucs Context
  Person(listener, "Listener")
  System(worlddemucs, "World-Demucs", "Static browser app for local environmental audio unmixing")
  System_Ext(githubPages, "GitHub Pages", "Static hosting")
  System_Ext(githubRepo, "GitHub repository", "Source, issues, stars")
  System_Ext(paypal, "PayPal", "Optional support link")
  Rel(listener, worlddemucs, "Runs in browser")
  Rel(githubPages, worlddemucs, "Serves")
  Rel(worlddemucs, githubRepo, "Links to")
  Rel(worlddemucs, paypal, "Links to")
```

## Containers

```mermaid
C4Container
  title World-Demucs Containers
  Person(listener, "Listener")
  System_Boundary(browser, "Browser runtime") {
    Container(ui, "UI shell", "TypeScript + Vite", "Controls transport, presets, mixer, status, model adapter")
    Container(audio, "Audio engine", "Web Audio API", "Owns AudioContext, microphone/demo sources, analyzers")
    Container(worklet, "Stem processor", "AudioWorklet", "Separates live audio into vocals, percussion, melody, residue proxy stems")
    Container(wasm, "Lazy WASM stack", "ONNX Runtime Web + RNNoise", "Loads after user action")
    Container(tone, "Tone clock", "Tone.js", "Rhythmic gating clock")
    ContainerDb(storage, "Preference store", "localStorage", "Mixer state only")
  }
  System_Ext(pages, "GitHub Pages", "Static files from main/docs")
  Rel(listener, ui, "Clicks and listens")
  Rel(pages, ui, "Serves")
  Rel(ui, audio, "Starts and updates")
  Rel(audio, worklet, "Streams PCM frames")
  Rel(audio, wasm, "Uses VAD/inference adapters")
  Rel(ui, tone, "Starts clock")
  Rel(ui, storage, "Reads/writes settings")
```

## Module Boundaries

`src/features/audio/` owns the mixer state, Web Audio lifecycle, manifest validation, lazy processing adapters, and visualizer.

`src/features/system/` owns build metadata and public GitHub commit lookup.

`public/worklets/` contains the real-time AudioWorklet processor served as a static asset.

`public/models/` contains the versioned model manifest contract.

`docs/` is the GitHub Pages publish directory and also stores ADRs and deployment docs.
