#!/usr/bin/env bash
set -euo pipefail

npm run build
npx vite preview --host 127.0.0.1 --port 4175 >/tmp/world-demucs-smoke.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 40); do
  if curl -fsS http://127.0.0.1:4175/world-demucs/ >/dev/null; then
    break
  fi
  sleep 0.25
done

PLAYWRIGHT_BASE_URL=http://127.0.0.1:4175 npx playwright test
