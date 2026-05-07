# 0006 - WASM Modules

## Status

Accepted

## Context

World-Demucs needs local inference and noise suppression. GitHub Pages cannot send custom cross-origin isolation headers, so WASM choices must work without custom server headers.

## Decision

Use ONNX Runtime Web as the Demucs inference adapter and `@shiguredo/rnnoise-wasm` as the RNNoise dependency anchor. Both are lazy-loaded after user activation. If the browser or asset contract cannot initialize ONNX, the app runs a Web Audio spectral stem approximation and clearly marks it as approximation mode.

## Consequences

The app remains usable on GitHub Pages without a backend. True Demucs quality depends on shipping or pointing to a compatible ONNX model asset, while the v1 browser graph still provides live controls and local processing.

## Alternatives Considered

Bundling a large model in the initial JavaScript was rejected because it would break the asset budget. Requiring a backend for inference was rejected because it violates the privacy goal.
