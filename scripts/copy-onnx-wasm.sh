#!/usr/bin/env bash
set -euo pipefail

mkdir -p public/onnx
rm -rf docs/assets docs/models docs/onnx docs/worklets
rm -f docs/404.html docs/favicon.svg docs/index.html docs/manifest.webmanifest docs/sw.js
cp node_modules/onnxruntime-web/dist/*.wasm public/onnx/
