# World-Demucs

![version](https://img.shields.io/badge/version-0.1.0-0f766e)
![deployment](https://img.shields.io/badge/deployment-GitHub%20Pages-2563eb)
![license](https://img.shields.io/badge/license-MIT-b45309)

Real-time browser audio unmixing for vocals, percussion, melody, and ambient residue.

Live site: https://baditaflorin.github.io/world-demucs/

Repository: https://github.com/baditaflorin/world-demucs

Support: https://www.paypal.com/paypalme/florinbadita

World-Demucs is a local-only reality mixer: microphone audio enters the browser, runs through a Web Audio worklet, RNNoise VAD bias, Tone.js rhythm timing, and an ONNX Runtime Web adapter, then comes back out as controllable stems. No backend, no accounts, no uploaded audio.

![World-Demucs screenshot](docs/demo-screenshot.png)

## Quickstart

```bash
npm install
make dev
make test
make build
make smoke
```

## Architecture

```mermaid
C4Context
  title World-Demucs Mode A
  Person(user, "Listener")
  System_Boundary(browser, "Browser") {
    Container(ui, "Static TypeScript UI", "Vite", "Mixer, presets, model controls")
    Container(worklet, "AudioWorklet", "Web Audio", "Low-latency stem proxy")
    Container(wasm, "WASM adapters", "ONNX Runtime Web + RNNoise", "Local inference and VAD")
    ContainerDb(storage, "localStorage", "Browser storage", "Mixer preferences")
  }
  System_Ext(pages, "GitHub Pages", "Static host")
  System_Ext(repo, "GitHub repository", "Source and stars")
  Rel(user, ui, "Uses")
  Rel(ui, worklet, "Controls")
  Rel(ui, wasm, "Lazy-loads")
  Rel(ui, storage, "Persists preferences")
  Rel(pages, ui, "Serves static app")
  Rel(ui, repo, "Links to")
```

More detail: docs/architecture.md

ADRs: docs/adr/

Deploy guide: docs/deploy.md

Privacy: docs/privacy.md

## Local Hooks

```bash
make install-hooks
```

The hooks run local checks only. There are no GitHub Actions.

## Notes

The app includes a browser-native proxy stem engine for immediate live use. The ONNX adapter is implemented and can probe compatible Demucs ONNX assets, but v1 does not bundle non-commercial neural weights into the MIT repository.
