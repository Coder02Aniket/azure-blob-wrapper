# Azure Blob Storage Integration — Depot Ledger

A two-part application for managing Azure Blob Storage objects:

- **`azure-blob-frontend`** — Depot Ledger, a React + TypeScript + Vite single-page app with a paper/ink design system, manifest table/grid, drag-and-drop upload queue, selection/bulk actions, and connection settings.
- **`azure-blob-wrapper`** — Spring Boot 4 API that talks to Azure Blob Storage and serves the built frontend.

## Repository structure

```
azure-blob-frontend/
  src/
    components/    layout, upload, blob manifest, settings, UI primitives
    hooks/         theme, persisted config, toasts, dialogs, blob list, upload queue
    lib/           API client, formatting, file helpers, validation
    styles/        design tokens and base styles
    App.tsx        Depot Ledger application shell
azure-blob-wrapper/
  src/main/java/…  controller, service, DTOs, exception advice, CORS config
  src/main/resources/static/   production frontend build output
```

## Backend

### Prerequisites

- Java 17+
- Maven (the repository includes `mvnw` / `mvnw.cmd`)

### Configuration

Configuration is environment-variable driven. Defaults are suitable for local development with Azurite.

| Variable | Default | Purpose |
| --- | --- | --- |
| `AZURE_STORAGE_CONNECTION_STRING` | Azurite development string | Storage account connection string |
| `AZURE_STORAGE_CONTAINER_NAME` | `your-container-name` | Container name used by the API |
| `DEPOT_CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins |

Clients may also override the connection string and container per request with the
`X-Azure-Connection-String` and `X-Azure-Container-Name` headers. The frontend stores these
values in `sessionStorage` by default and only in `localStorage` when **Remember on this device**
is explicitly enabled. Prefer HTTPS whenever a real connection string is supplied.

### Run

```bash
cd azure-blob-wrapper
./mvnw spring-boot:run     # Windows: .\mvnw.cmd spring-boot:run
```

### API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/blobs/list` | Returns `BlobMetadata[]` (`name`, `size`, `lastModified`, `contentType`, `etag`) |
| `GET` | `/api/blobs/download?name=…` | Streams the blob with a RFC 5987 `Content-Disposition` header |
| `POST` | `/api/blobs/upload` | Multipart `file` field; responds `{ name, url, size }` |
| `DELETE` | `/api/blobs/delete?name=…` | Deletes the blob and responds `204 No Content` |

Errors are JSON: `{ "status": 404, "error": "BlobNotFound", "message": "…" }`.

### Tests

```bash
cd azure-blob-wrapper
./mvnw test     # Windows: .\mvnw.cmd test
```

## Frontend

### Prerequisites

- Node.js 18+ or Bun

### Develop

```bash
cd azure-blob-frontend
bun install        # or npm install
bun run dev        # or npm run dev
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8080`.

### Quality checks

```bash
bun run lint
bun run build
npm run lint && npm run build   # equivalent npm commands
```

`npm run build` / `bun run build` type-checks and writes the production bundle directly into
`../azure-blob-wrapper/src/main/resources/static`, so the Spring Boot jar serves the Depot Ledger UI.

## Using Depot Ledger

- **Upload** — click the intake strip, use the hidden file picker, or drop files anywhere on the page. Multiple files are queued (two concurrent uploads) with progress, cancel, retry, and overwrite warnings. Maximum size is 100 MB per object.
- **Manifest** — switch between table and grid, filter by key or file type, sort by key/size/modified date, and paginate 100 rows at a time.
- **Preview** — the eye action (or double-clicking a key/card) opens an inline viewer for images, videos, PDFs, and text-based files. Other formats fall back to download. Text previews over 2 MB are download-only.
- **Select** — click rows/cards, Shift-click for ranges, or use the header checkbox. Bulk actions copy keys or delete selected objects.
- **Delete** — always opens a confirmation dialog listing the objects. Deletes run sequentially and report per-object failures.
- **Settings** — open with the rail link or `,` to set container, connection string, and API endpoint. Credentials are session-scoped unless you opt into remembering them.
- **Keyboard** — `/` focuses the filter, `?` opens the keyboard map, `T` toggles light/dark theme, `Esc` closes overlays.

## Local smoke test

1. Start Azurite (or configure a real storage account via environment variables).
2. Start the Spring Boot backend on port 8080.
3. Run `bun run dev` in `azure-blob-frontend` and open `http://localhost:5173`.
4. Upload a file, verify it appears in the manifest, download it, then delete it.
