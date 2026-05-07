#!/usr/bin/env bash
set -euo pipefail

message_file="${1:-}"
if [[ -z "$message_file" || ! -f "$message_file" ]]; then
  printf "%s\n" "Commit message file not found" >&2
  exit 1
fi

first_line="$(sed -n '1p' "$message_file")"
pattern='^(feat|fix|docs|chore|refactor|test|ops|data|style|perf|build|ci)(\([a-z0-9._-]+\))?!?: .+'

if [[ ! "$first_line" =~ $pattern ]]; then
  printf "%s\n" "Commit message must use Conventional Commits, e.g. feat: add stem controls" >&2
  exit 1
fi
