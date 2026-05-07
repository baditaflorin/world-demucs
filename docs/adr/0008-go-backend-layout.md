# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

The bootstrap requires Go layout decisions for Mode B or Mode C projects. World-Demucs v1 is Mode A.

## Decision

Skip the Go backend entirely. No `cmd/`, `internal/`, `pkg/`, `api/`, `configs/`, or Docker runtime code is created in v1.

## Consequences

The repository stays focused on the static frontend. Backend-specific lint, metrics, Docker, and deployment sections are marked not applicable.

## Alternatives Considered

A Go API wrapper around ONNX inference was rejected because it would move private audio off-device and require Mode C.
