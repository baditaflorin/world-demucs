# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Permission prompts, unsupported browsers, missing models, and worklet failures need clear handling.

## Decision

Represent recoverable failures as typed results and show concise UI notices with a next action. Fatal app bootstrap errors render a fallback screen. Do not throw from UI event handlers without catching and surfacing the failure.

## Consequences

Users can distinguish unsupported features from temporary permission or asset problems. Tests can assert specific error states.

## Alternatives Considered

Console-only errors were rejected because this is an end-user audio tool, not a developer demo.
