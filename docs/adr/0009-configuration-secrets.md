# 0009 - Configuration and Secrets Management

## Status

Accepted

## Context

Mode A should not require runtime secrets. The frontend cannot safely contain API keys, private model URLs, or credentials.

## Decision

Keep all configuration public and build-time only. The only committed environment example is `.env.example`, and it contains no secrets. Public repository, PayPal, Pages URL, and model manifest paths are safe to ship in the frontend.

## Consequences

There is no secret rotation burden in v1. Any future secret requirement must trigger a new ADR and likely a Mode B offline pipeline or Mode C backend.

## Alternatives Considered

Encrypted or obfuscated frontend secrets were rejected because they are still client-exposed secrets.
