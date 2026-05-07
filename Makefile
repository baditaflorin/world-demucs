.PHONY: help install-hooks dev build test test-integration smoke lint fmt fmt-check pages-preview hooks-pre-commit hooks-commit-msg hooks-pre-push hooks-post-checkout clean

help:
	@printf "%s\n" "World-Demucs targets:"
	@printf "%s\n" "  make install-hooks      Wire .githooks"
	@printf "%s\n" "  make dev                Run Vite locally"
	@printf "%s\n" "  make build              Build Pages output into docs/"
	@printf "%s\n" "  make test               Run unit tests"
	@printf "%s\n" "  make test-integration   Placeholder for future browser audio integration tests"
	@printf "%s\n" "  make smoke              Build and run Playwright smoke test"
	@printf "%s\n" "  make lint               Run ESLint"
	@printf "%s\n" "  make fmt                Autoformat"
	@printf "%s\n" "  make pages-preview      Preview docs/ exactly under the Pages base path"
	@printf "%s\n" "  make clean              Remove generated frontend output"

install-hooks:
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev:
	npm run dev

build:
	npm run build

test:
	npm test

test-integration:
	@printf "%s\n" "No integration suite is required for Mode A v1."

smoke:
	npm run smoke

lint:
	npm run lint

fmt:
	npm run fmt

fmt-check:
	npm run fmt:check

pages-preview:
	npm run build
	npx vite preview --host 127.0.0.1 --port 4175

hooks-pre-commit:
	npm run fmt:check
	npm run lint
	npm run build
	@if command -v gitleaks >/dev/null 2>&1; then gitleaks protect --staged --redact; else printf "%s\n" "gitleaks not installed; skipping secret scan"; fi

hooks-commit-msg:
	@scripts/validate-conventional-commit.sh "$${COMMIT_MSG_FILE:-.git/COMMIT_EDITMSG}"

hooks-pre-push:
	$(MAKE) test
	$(MAKE) build
	$(MAKE) smoke

hooks-post-checkout:
	scripts/copy-onnx-wasm.sh

clean:
	rm -rf docs/assets docs/models docs/onnx docs/worklets docs/index.html docs/404.html docs/favicon.svg docs/manifest.webmanifest docs/sw.js coverage playwright-report test-results
