# 0003 - Frontend Framework and Build Tooling

## Status

Accepted

## Context

The interface is a focused audio tool with strict payload limits and no server. It needs TypeScript, fast local iteration, static output, and lazy loading for heavy audio libraries.

## Decision

Use Vite with strict TypeScript and framework-free DOM modules. Avoid React in v1 to keep the first-load JavaScript small. Use package-level libraries only where they carry clear value: ONNX Runtime Web, Tone.js, zod, Vitest, Playwright, and gitleaks hooks.

## Consequences

The app has a small initial payload and direct control over Web Audio lifecycle. UI code must stay disciplined because there is no component framework.

## Alternatives Considered

React was considered but rejected for v1 because it spends first-load budget without solving the hardest audio problems. Svelte and Lit were also reasonable but unnecessary for this UI size.
