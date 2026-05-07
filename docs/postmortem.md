# Postmortem

## What Was Built

World-Demucs v0.1.0 is a Mode A GitHub Pages app at https://baditaflorin.github.io/world-demucs/.

It includes a static TypeScript/Vite frontend, Web Audio microphone and demo input paths, an AudioWorklet stem processor, vocals/percussion/melody/residue controls, Tone.js rhythm timing, RNNoise VAD probing, an ONNX Runtime Web adapter, a model manifest, PWA assets, localStorage preferences, docs, ADRs, local hooks, unit tests, and Playwright smoke tests.

The app links prominently to https://github.com/baditaflorin/world-demucs and https://www.paypal.com/paypalme/florinbadita.

## Was Mode A Correct?

Yes. Mode A was the correct v1 choice. The app can capture, route, process, and control ambient audio locally without a backend, auth, secrets, or persisted server state.

The only tension is true Demucs model quality. Browser-compatible Demucs ONNX weights are large, and the public reference found for HTDemucs v4 ONNX is non-commercial. Keeping the app static and MIT-friendly means v1 ships the ONNX adapter plus an explicit external-model path instead of bundling those weights silently.

## What Worked

GitHub Pages from `main` `/docs` worked cleanly.

Lazy-loading kept the initial app bundle small while preserving ONNX/RNNoise availability.

The demo audio path made smoke testing possible without microphone permissions.

Plain git hooks were enough for local quality gates.

## What Did Not Work

Embedding `git rev-parse HEAD` into the generated Pages build caused a publish loop: pre-push builds dirtied `docs/` after the commit. The fix was to make the static build deterministic and show the current commit through the public GitHub commit lookup in the page footer.

## What Surprised Us

ONNX Runtime Web emits a large WASM asset even though the adapter is lazy. That is acceptable for v1 because it is not part of the initial JavaScript payload, but it should be watched.

## Tech Debt Accepted

The live stem separation path is a low-latency Web Audio proxy, not neural Demucs inference on every live frame.

The RNNoise integration uses VAD bias for the stem processor rather than full denoised audio replacement.

The external Demucs model entry is opt-in and not bundled because of size and licensing.

## Next Three Improvements

1. Add a small redistributable ONNX stem model optimized for browser latency.
2. Move model inference into a dedicated worker with chunked overlap-add reconstruction.
3. Add an advanced calibration panel for device latency, headphone gain, and browser support diagnostics.

## Time Spent vs Estimate

Estimated: 4 to 6 hours for a static v1 with docs and publishing.

Actual: about 4 hours of implementation, verification, Pages setup, and cleanup.
