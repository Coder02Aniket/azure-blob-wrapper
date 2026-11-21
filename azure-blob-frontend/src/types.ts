export interface BlobMetadata {
  name: string;
  size: number;
  lastModified: string;
  contentType: string;
  etag: string;
}

export interface BlobConfig {
  connectionString: string;
  containerName: string;
  endpoint?: string;
  remember?: boolean;
}

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'canceled';

export interface UploadAbortHandle {
  abort: () => void;
}

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  loaded: number;
  total: number;
  error?: string;
  detail?: string;
  xhr?: UploadAbortHandle;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

export type ViewMode = 'table' | 'grid';

export type ViewerKind = 'image' | 'video' | 'pdf' | 'text';

export type SortField = 'name' | 'size' | 'lastModified';
export type SortDirection = 'asc' | 'desc';

export type FileCategory = 'all' | 'documents' | 'images' | 'media' | 'archives' | 'code' | 'data' | 'other';

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
}
