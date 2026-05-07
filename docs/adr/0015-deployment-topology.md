# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode C topology would include Docker Compose, nginx, TLS, and Prometheus. Mode A does not need those pieces.

## Decision

Deploy only through GitHub Pages from `main` `/docs`. There is no `deploy/` directory, no nginx config, no Docker image, and no server port.

## Consequences

Operational rollback is a git revert and push. Pages-specific gotchas are documented in `docs/deploy.md`.

## Alternatives Considered

A Docker backend on port 25342 was rejected because no runtime API is needed.
