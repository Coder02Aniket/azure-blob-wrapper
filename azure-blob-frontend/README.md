# Depot Ledger (frontend)

React + TypeScript + Vite UI for the Azure Blob wrapper API.

## Commands

```bash
bun install          # or npm install
bun run dev          # http://localhost:5173, proxies /api to 127.0.0.1:8080
bun run lint
bun run build        # emits ../../azure-blob-wrapper/src/main/resources/static
```

## Architecture

- `src/lib/api.ts` — explicit REST/XHR client. Direct uploads use `XMLHttpRequest` for progress and cancel; files over 8 MB are split into 4 MB Azure block-blob chunks with per-chunk retry and a final commit. Downloads trigger a browser save; preview fetches reuse the same configured client.
- `src/hooks/` — stateful behaviours: theme, session-scoped connection config, toasts, native dialog control, manifest listing/filtering/selection, and the upload queue.
- `src/components/ui/` — small presentational primitives (buttons, fields, dialog, drawer, toasts).
- `src/components/layout/` — 248px rail and topbar; collapses to a horizontal bar below 1024px.
- `src/components/blobs/` — manifest table, card grid, file glyphs, empty/loading/error states, bulk action bar.
- `src/components/upload/` — intake strip, full-page drop overlay, upload queue with progress.
- `src/components/viewers/` — inspection-sheet viewer for images, video, PDF, and text previews.
- `src/styles/` — Archivo + IBM Plex Mono fonts (self-hosted via Fontsource), design tokens, reset, reduced-motion handling.

## Connection configuration

Settings live in the connection drawer (rail link or `,`). Values are saved to `sessionStorage`
by default. **Remember on this device** is an explicit opt-in that moves them to `localStorage`.
When no connection string is supplied the backend uses its environment-configured default.

## Inline viewers

The eye action in table rows and grid cards, or double-clicking a key/card, opens a full-screen
inspection sheet. It supports images, video, PDF, and text files (up to 2 MB). Object bytes are
fetched through the same authenticated API client as downloads and rendered from an object URL,
which is revoked when the viewer closes. Other formats, oversized text, and failed fetches offer a
download fallback.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `/` | Focus key filter |
| `?` | Show keyboard map |
| `,` | Open connection settings |
| `T` | Toggle light/dark theme |
| `Esc` | Close overlays |
