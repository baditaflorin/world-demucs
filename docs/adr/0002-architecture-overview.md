# 0002 - Architecture Overview and Module Boundaries

## Status

Accepted

## Context

The app needs microphone capture, local inference, noise suppression, musical/rhythmic controls, persistence, and a static deployment boundary.

## Decision

Use a browser-only layered architecture: `features/audio` owns capture, routing, stem state, and workers; `features/system` owns version and repository metadata; `shared` owns small UI and validation helpers; `worklets` owns real-time audio processors; `workers` owns heavier inference and DSP orchestration.

## Consequences

Real-time work stays off the main thread where browser APIs allow it. UI state remains separate from the audio graph so controls can be tested without a live microphone.

## Alternatives Considered

A monolithic main-thread audio controller was rejected because it would make latency and UI regressions harder to isolate. A backend service was rejected in ADR 0001.
