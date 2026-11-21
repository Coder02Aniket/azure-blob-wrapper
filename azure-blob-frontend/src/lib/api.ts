import type { BlobConfig, BlobMetadata, ApiErrorResponse } from '../types';

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

function buildHeaders(config?: BlobConfig): HeadersInit {
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

export async function downloadBlob(fileName: string, config?: BlobConfig): Promise<void> {
  const base = getBaseUrl(config);
  const url = `${base}/api/blobs/download?name=${encodeURIComponent(fileName)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(config),
    });
  } catch {
    throw new ApiError(0, 'NetworkError', `Failed to download '${fileName}'. Check network.`);
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
      errBody?.message || `Failed to download file (HTTP ${response.status})`
    );
  }

  const blob = await response.blob();
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

export function uploadBlobWithProgress(
  file: File,
  config?: BlobConfig,
  onProgress?: (loaded: number, total: number) => void
): { promise: Promise<{ name: string; url: string; size: number }>; abort: () => void; xhr: XMLHttpRequest } {
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
