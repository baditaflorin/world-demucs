# 0013 - Testing Strategy

## Status

Accepted

## Context

The project needs fast local checks and no GitHub Actions. Browser audio APIs are hard to fully exercise headlessly.

## Decision

Use Vitest for pure TypeScript modules, TypeScript type checks for integration boundaries, and Playwright smoke tests against a built static site. `make test`, `make build`, and `make smoke` are the pre-push contract.

## Consequences

Core state reducers and manifest validation are covered quickly. The smoke test verifies the Pages build loads and the primary controls render. Manual microphone testing remains required for real device audio capture.

## Alternatives Considered

Full Web Audio e2e testing in CI was rejected because no GitHub Actions are used and headless microphone simulation would be brittle.
