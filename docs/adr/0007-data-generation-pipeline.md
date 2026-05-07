# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode B would require local or scheduled data generation. World-Demucs v1 does not need scraped, transformed, or scheduled data artifacts.

## Decision

Do not include a data generation pipeline in v1. The `make data` target is intentionally absent. Static model metadata is maintained by normal source edits under `public/models/`.

## Consequences

There are no generated data artifacts to refresh, no cadence to document, and no release-hosted data files in v1.

## Alternatives Considered

A Mode B release artifact pipeline for ONNX models was considered. It is deferred until a redistributable browser-sized Demucs model is selected.
