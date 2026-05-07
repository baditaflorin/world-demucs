# 0010 - GitHub Pages Publishing

## Status

Accepted

## Context

The live URL must work from day one and the built frontend must be committed because no GitHub Actions are used. GitHub Pages supports publishing from the `main` branch `/docs` folder.

## Decision

Publish from `main` and `/docs` at https://baditaflorin.github.io/world-demucs/. Vite uses `base: "/world-demucs/"`, emits hashed assets under `docs/assets/`, and keeps `docs/` in git. The build does not wipe `docs/adr/` or other documentation folders.

## Consequences

Every release commit includes source and generated Pages output. The `.gitignore` excludes `dist/` but intentionally does not exclude `docs/`. Rollback is a normal git revert plus push.

## Alternatives Considered

A `gh-pages` branch was considered, but it would hide the generated artifact from normal review. Publishing from the repository root was rejected to keep source and generated assets separated.
