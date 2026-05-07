# Privacy

World-Demucs is designed as a local browser app.

## Audio

Microphone audio is requested through the browser permission prompt and processed locally through Web Audio, AudioWorklet, RNNoise WASM, and optional ONNX Runtime Web adapters.

The app does not upload, record, store, or transmit microphone audio.

## Storage

The app stores only mixer preferences in `localStorage`.

Stored values include stem gains, mute/solo/invert flags, rhythm settings, and adapter preferences.

No audio buffers, microphone samples, model outputs, API keys, or personal identifiers are stored.

## Analytics

No analytics are enabled in v1.

## Network Requests

The static app is served from https://baditaflorin.github.io/world-demucs/.

The footer fetches the public latest commit from https://api.github.com/repos/baditaflorin/world-demucs/commits/main.

The ONNX model adapter can load the external model URL listed in `models/demucs-manifest.json` only when the user explicitly presses Load for that model.

## Support Links

The app links to https://github.com/baditaflorin/world-demucs and https://www.paypal.com/paypalme/florinbadita.
