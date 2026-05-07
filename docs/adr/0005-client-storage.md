# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

Users need repeatable mixer settings and privacy-preserving local state. Cross-device sync is not a v1 requirement.

## Decision

Use `localStorage` for compact preferences: stem gains, mute/solo/invert flags, selected preset, and whether the user opted into the ONNX model path. Do not persist microphone audio, decoded audio buffers, or model outputs.

## Consequences

The app restores quickly and stays private. Settings are easy to clear from the browser. Storage quota and schema migration complexity remain low.

## Alternatives Considered

IndexedDB and OPFS were considered for audio/model caches. They are deferred until v1 has a packaged model large enough to justify persistent asset caching.
