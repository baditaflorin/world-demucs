# 0004 - Static Model and Data Contract

## Status

Accepted

## Context

Mode A has no generated data pipeline, but the app still needs a stable way to discover optional ONNX model assets and demo presets.

## Decision

Ship `models/demucs-manifest.json` as the v1 static contract. It includes `schemaVersion`, `defaultModelId`, model entries, stem names, expected sample rate, segment duration, and browser support notes. Missing model URLs are valid and mean the app should fall back to the real-time spectral/RNNoise approximation path.

## Consequences

The UI can honestly report whether ONNX Demucs is available, unavailable, or running in approximation mode. Future model assets can be added without changing the app's control contract.

## Alternatives Considered

Hardcoding model metadata in TypeScript was rejected because the asset contract should be inspectable from the published site. A runtime API was rejected in ADR 0001.
