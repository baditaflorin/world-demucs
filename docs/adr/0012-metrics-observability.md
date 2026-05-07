# 0012 - Metrics and Observability

## Status

Accepted

## Context

Mode A has no Prometheus endpoint or server process. Usage insight is less important than privacy for v1.

## Decision

Ship no analytics by default. The app surfaces local health indicators: audio context state, microphone permission state, worklet state, inference mode, buffer latency, and dropped-frame estimate.

## Consequences

The project has no external observability dependency and collects no user telemetry. Debugging relies on local reproduction and user-provided reports.

## Alternatives Considered

Plausible and a Cloudflare Worker beacon were considered and rejected for v1 because analytics are not required for the core value proposition.
