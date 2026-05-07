# 0017 - Dependency Policy

## Status

Accepted

## Context

Audio and inference code should lean on established packages while protecting the first-load budget.

## Decision

Use production-ready libraries for specialized work: Vite, TypeScript, zod, ONNX Runtime Web, Tone.js, RNNoise WASM package, Vitest, Playwright, ESLint, Prettier, and Gitleaks. Heavy audio libraries must be lazy-loaded behind user activation.

## Consequences

The project avoids custom inference and noise suppression implementations while keeping initial load small. Dependency updates require `npm audit` and smoke testing.

## Alternatives Considered

Hand-rolled ONNX, resampling, or denoising engines were rejected as too risky for v1.
