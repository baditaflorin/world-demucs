# 0011 - Logging Strategy

## Status

Accepted

## Context

There is no server log stream in Mode A. Browser console noise should be low in production while still helping local development.

## Decision

Use a tiny client logger that emits debug details only in development. Production logs are limited to user-actionable initialization failures that also appear in the UI.

## Consequences

No PII or audio-derived data is logged. Developers still get enough local diagnostics for model and audio graph initialization.

## Alternatives Considered

Remote logging was rejected because it would add tracking surface and a backend-like dependency.
