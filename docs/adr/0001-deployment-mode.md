# 0001 - Deployment Mode

## Status

Accepted

## Context

World-Demucs is meant to reshape ambient audio while preserving user privacy. The core loop captures microphone audio, processes it locally, and exposes mix controls without uploading audio or requiring an account.

## Decision

Use Mode A: Pure GitHub Pages. The frontend, Web Audio graph, AudioWorklets, ONNX Runtime Web, Tone.js transport helpers, RNNoise WASM integration point, and model manifest are all shipped as static assets. No runtime backend is part of v1.

## Consequences

Audio never leaves the browser by design. GitHub Pages cannot set arbitrary COOP/COEP headers, so v1 avoids SharedArrayBuffer-only paths and lazy-loads WASM/model assets after user activation. Large model files are referenced by a static manifest and can be replaced with release-hosted assets later without adding a server.

## Alternatives Considered

Mode B was unnecessary because there is no scheduled data generation. Mode C was rejected because a runtime backend would add hosting, secrets, and privacy risk without being required for v1.
