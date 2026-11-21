import type { BlobConfig, BlobMetadata, ApiErrorResponse, UploadAbortHandle } from '../types';

export class ApiError extends Error {
  public status: number;
  public error: string;

  constructor(status: number, error: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.error = error;
  }
}

function getBaseUrl(config?: BlobConfig): string {
  if (config?.endpoint) {
    return config.endpoint.replace(/\/+$/, '');
  }
  return '';
}

function buildHeaders(config?: BlobConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  if (config?.connectionString?.trim()) {
    headers['X-Azure-Connection-String'] = config.connectionString.trim();
  }
  if (config?.containerName?.trim()) {
    headers['X-Azure-Container-Name'] = config.containerName.trim();
  }
  return headers;
}

export async function fetchBlobs(config?: BlobConfig, signal?: AbortSignal): Promise<BlobMetadata[]> {
  const base = getBaseUrl(config);
  const url = `${base}/api/blobs/list`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(config),
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError(0, 'NetworkError', 'Could not reach Azure Blob service. Check connection or backend status.');
  }

  if (!response.ok) {
    let errBody: ApiErrorResponse | null = null;
    try {
      errBody = await response.json();
    } catch {
      // not json
    }
    throw new ApiError(
      response.status,
      errBody?.error || response.statusText || 'Error',
      errBody?.message || `Failed to fetch blob list (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  // Handle both BlobMetadata[] and legacy string[]
  return data.map((item: unknown) => {
    if (typeof item === 'string') {
      return {
        name: item,
        size: 0,
        lastModified: new Date().toISOString(),
        contentType: 'application/octet-stream',
        etag: '',
      };
    }
    const meta = item as Record<string, unknown>;
    return {
      name: String(meta.name || ''),
      size: typeof meta.size === 'number' ? meta.size : 0,
      lastModified: String(meta.lastModified || new Date().toISOString()),
      contentType: String(meta.contentType || 'application/octet-stream'),
      etag: String(meta.etag || ''),
    };
  });
}

/** Fetches raw object bytes for inline preview, keeping custom headers intact. */
export async function fetchBlobForPreview(
  fileName: string,
  config?: BlobConfig,
  signal?: AbortSignal
): Promise<Blob> {
  const base = getBaseUrl(config);
  const url = `${base}/api/blobs/download?name=${encodeURIComponent(fileName)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(config),
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NetworkError', `Failed to load '${fileName}'. Check network.`);
  }

  if (!response.ok) {
    let errBody: ApiErrorResponse | null = null;
    try {
      errBody = await response.json();
    } catch {
      // ignored
    }
    throw new ApiError(
      response.status,
      errBody?.error || response.statusText,
      errBody?.message || `Failed to load '${fileName}' (HTTP ${response.status})`
    );
  }

  return response.blob();
}

export async function downloadBlob(fileName: string, config?: BlobConfig): Promise<void> {
  const blob = await fetchBlobForPreview(fileName, config);
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName.split('/').pop() || fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export async function deleteBlob(fileName: string, config?: BlobConfig): Promise<void> {
  const base = getBaseUrl(config);
  const url = `${base}/api/blobs/delete?name=${encodeURIComponent(fileName)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'DELETE',
      headers: buildHeaders(config),
    });
  } catch {
    throw new ApiError(0, 'NetworkError', `Failed to delete '${fileName}'. Check network.`);
  }

  if (!response.ok && response.status !== 204) {
    let errBody: ApiErrorResponse | null = null;
    try {
      errBody = await response.json();
    } catch {
      // ignored
    }
    throw new ApiError(
      response.status,
      errBody?.error || response.statusText,
      errBody?.message || `Failed to delete blob (HTTP ${response.status})`
    );
  }
}

export type UploadProgressCallback = (loaded: number, total: number, detail?: string) => void;

export interface UploadCompletion {
  name: string;
  url: string;
  size: number;
}

export function uploadBlobWithProgress(
  file: File,
  config?: BlobConfig,
  onProgress?: UploadProgressCallback
): { promise: Promise<UploadCompletion>; abort: () => void; xhr: XMLHttpRequest } {
  const xhr = new XMLHttpRequest();
  const base = getBaseUrl(config);
  const url = `${base}/api/blobs/upload`;

  const promise = new Promise<{ name: string; url: string; size: number }>((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded, e.total);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch {
          resolve({ name: file.name, url: '', size: file.size });
        }
      } else {
        let msg = `Upload failed with HTTP ${xhr.status}`;
        try {
          const json = JSON.parse(xhr.responseText);
          if (json.message) msg = json.message;
        } catch {
          // not json
        }
        reject(new ApiError(xhr.status, 'UploadError', msg));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ApiError(0, 'NetworkError', 'Upload failed due to a network interruption.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new ApiError(0, 'Aborted', 'Upload was canceled.'));
    });

    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', url, true);

    if (config?.connectionString?.trim()) {
      xhr.setRequestHeader('X-Azure-Connection-String', config.connectionString.trim());
    }
    if (config?.containerName?.trim()) {
      xhr.setRequestHeader('X-Azure-Container-Name', config.containerName.trim());
    }

    xhr.send(formData);
  });

  return {
    promise,
    abort: () => xhr.abort(),
    xhr,
  };
}

/* -------------------------------------------------------------------------- */
/* Chunked (Azure block blob) uploads                                          */
/* -------------------------------------------------------------------------- */

/** 4 MB per block — comfortably below Azure's block-size ceiling. */
export const CHUNK_SIZE = 4 * 1024 * 1024;
/** Files above this size use staged blocks instead of a single multipart POST. */
export const CHUNKED_UPLOAD_THRESHOLD = 8 * 1024 * 1024;
const MAX_CHUNK_ATTEMPTS = 3;

export function shouldUseChunkedUpload(file: File): boolean {
  return file.size > CHUNKED_UPLOAD_THRESHOLD;
}

function createUploadId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `upl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function stageChunk(
  chunk: Blob,
  name: string,
  uploadId: string,
  index: number,
  config: BlobConfig | undefined,
  onProgress: (loaded: number) => void,
  onXhr: (xhr: XMLHttpRequest) => void
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    onXhr(xhr);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    });
    xhr.addEventListener('load', () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let message = `Chunk ${index + 1} failed with HTTP ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText) as { message?: string };
          if (body.message) message = body.message;
        } catch {
          // non-JSON error body
        }
        reject(new ApiError(xhr.status, 'ChunkError', message));
        return;
      }
      try {
        const body = JSON.parse(xhr.responseText) as { blockId?: string };
        if (!body.blockId) {
          reject(new ApiError(xhr.status, 'ChunkError', 'Staging response did not include a block id.'));
          return;
        }
        resolve(body.blockId);
      } catch {
        reject(new ApiError(xhr.status, 'ChunkError', 'Unexpected staging response.'));
      }
    });
    xhr.addEventListener('error', () => {
      reject(new ApiError(0, 'NetworkError', `Chunk ${index + 1} failed due to a network interruption.`));
    });
    xhr.addEventListener('abort', () => {
      reject(new ApiError(0, 'Aborted', 'Upload was canceled.'));
    });

    const formData = new FormData();
    formData.append('file', chunk, `chunk-${index}`);
    formData.append('name', name);
    formData.append('uploadId', uploadId);
    formData.append('index', String(index));

    xhr.open('POST', `${getBaseUrl(config)}/api/blobs/upload/block`, true);
    const headers = buildHeaders(config);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.send(formData);
  });
}

async function commitBlocks(
  name: string,
  blockIds: string[],
  contentType: string,
  config?: BlobConfig
): Promise<UploadCompletion> {
  const body = new URLSearchParams();
  body.set('name', name);
  body.set('blockIds', blockIds.join(','));
  if (contentType) body.set('contentType', contentType);

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl(config)}/api/blobs/upload/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        ...buildHeaders(config),
      },
      body,
    });
  } catch {
    throw new ApiError(0, 'NetworkError', 'Failed to finalize the upload. Check network.');
  }

  if (!response.ok) {
    let errBody: ApiErrorResponse | null = null;
    try {
      errBody = (await response.json()) as ApiErrorResponse;
    } catch {
      // ignored
    }
    throw new ApiError(
      response.status,
      errBody?.error || response.statusText,
      errBody?.message || `Failed to finalize upload (HTTP ${response.status})`
    );
  }

  const result = (await response.json()) as UploadCompletion;
  return {
    name: result.name || name,
    url: result.url || '',
    size: result.size || 0,
  };
}

/**
 * Uploads a file as independently staged Azure blocks. Each block is retried up to
 * three times; canceling aborts whichever block is currently in flight. Uncommitted
 * blocks from an abandoned upload expire in Azure and never appear in the manifest.
 */
export function uploadBlobChunked(
  file: File,
  config: BlobConfig | undefined,
  onProgress: UploadProgressCallback
): { promise: Promise<UploadCompletion>; xhr: UploadAbortHandle } {
  const uploadId = createUploadId();
  const chunkCount = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const blockIds = new Array<string>(chunkCount);
  let canceled = false;
  let activeXhr: XMLHttpRequest | null = null;

  const handle: UploadAbortHandle = {
    abort: () => {
      canceled = true;
      activeXhr?.abort();
    },
  };

  const promise = (async () => {
    let uploaded = 0;

    for (let index = 0; index < chunkCount; index += 1) {
      if (canceled) throw new ApiError(0, 'Aborted', 'Upload was canceled.');

      const start = index * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const detail = `CHUNK ${index + 1}/${chunkCount}`;
      let staged = false;
      let lastError: unknown;

      for (let attempt = 0; attempt < MAX_CHUNK_ATTEMPTS; attempt += 1) {
        try {
          const blockId = await stageChunk(
            chunk, file.name, uploadId, index, config,
            (loaded) => onProgress(Math.min(uploaded + loaded, file.size), file.size, detail),
            (xhr) => { activeXhr = xhr; }
          );
          blockIds[index] = blockId;
          uploaded = end;
          onProgress(uploaded, file.size, detail);
          staged = true;
          break;
        } catch (err: unknown) {
          lastError = err;
          if (canceled || (err instanceof ApiError && err.error === 'Aborted')) throw err;
          if (attempt < MAX_CHUNK_ATTEMPTS - 1) {
            await new Promise<void>((resolve) => {
              window.setTimeout(resolve, 300 * (attempt + 1));
            });
          }
        }
      }

      if (!staged) {
        throw lastError instanceof Error
          ? lastError
          : new ApiError(0, 'ChunkError', `Chunk ${index + 1} could not be staged.`);
      }
    }

    return commitBlocks(file.name, blockIds, file.type, config);
  })();

  return { promise, xhr: handle };
}
