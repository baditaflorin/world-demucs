# Deploy

Live site: https://baditaflorin.github.io/world-demucs/

Repository: https://github.com/baditaflorin/world-demucs

## Mode

World-Demucs uses Mode A: Pure GitHub Pages. There is no runtime backend, Docker image, nginx, server port, database, or secret store.

## Publishing

GitHub Pages is configured to publish from `main` and `/docs`.

Manual publish:

```bash
npm install
make test
make build
git add docs package-lock.json
git commit -m "chore: publish pages build"
git push
```

## Preview

```bash
make pages-preview
```

Then open http://127.0.0.1:4175/world-demucs/

## Rollback

Revert the bad publishing commit and push:

```bash
git revert <commit>
git push
```

## Custom Domains

No custom domain is configured in v1. If one is added later, create a `CNAME` file under `public/`, rebuild, and configure DNS according to GitHub Pages documentation.

## Pages Gotchas

The app base path is `/world-demucs/`.

GitHub Pages does not support `_headers` or `_redirects`.

The service worker scope is `/world-demucs/`.

The app ships a `404.html` fallback that returns users to `/world-demucs/`.
