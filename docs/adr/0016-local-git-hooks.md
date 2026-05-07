# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project uses local hooks instead of GitHub Actions. Hooks must be easy to install and runnable manually.

## Decision

Use plain `.githooks/` with `core.hooksPath`. `make install-hooks` wires them. Pre-commit runs formatting, lint, type checks, and gitleaks where available. Commit-msg validates Conventional Commits. Pre-push runs test, build, and smoke.

## Consequences

Checks run before code leaves the machine. Contributors without optional binaries get clear messages and can install missing tools.

## Alternatives Considered

Lefthook was considered but plain hooks are sufficient for v1 and avoid another configuration layer.
