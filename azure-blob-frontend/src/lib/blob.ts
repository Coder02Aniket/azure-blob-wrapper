import type { BlobMetadata, FileCategory, ViewerKind } from '../types';

const IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'tif', 'ico', 'avif',
]);

const VIDEO_EXTENSIONS = new Set([
  'mp4', 'webm', 'mov', 'm4v', 'ogv', 'ogg', 'mkv', 'avi',
]);

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'jsonl', 'xml', 'yaml', 'yml',
  'log', 'js', 'jsx', 'ts', 'tsx', 'java', 'py', 'go', 'rs', 'c', 'h', 'cpp',
  'sh', 'bash', 'ps1', 'html', 'htm', 'css', 'scss', 'sql', 'ini', 'env', 'rtf',
]);

export function getFileCategory(name: string, contentType?: string): FileCategory {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'md', 'epub'].includes(ext) ||
      contentType?.includes('pdf') || contentType?.includes('text/plain') || contentType?.includes('word')) {
    return 'documents';
  }

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'ico', 'avif'].includes(ext) ||
      contentType?.startsWith('image/')) {
    return 'images';
  }

  if (['mp3', 'wav', 'ogg', 'mp4', 'webm', 'mov', 'mkv', 'avi', 'flac'].includes(ext) ||
      contentType?.startsWith('video/') || contentType?.startsWith('audio/')) {
    return 'media';
  }

  if (['zip', 'tar', 'gz', 'tgz', '7z', 'rar', 'bz2', 'xz'].includes(ext) ||
      contentType?.includes('zip') || contentType?.includes('compressed') || contentType?.includes('tar')) {
    return 'archives';
  }

  if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'scss', 'java', 'py', 'go', 'rs', 'c', 'cpp', 'sh', 'yaml', 'yml'].includes(ext) ||
      contentType?.includes('javascript') || contentType?.includes('json') || contentType?.includes('html')) {
    return 'code';
  }

  if (['csv', 'tsv', 'parquet', 'sql', 'sqlite', 'db', 'xlsx', 'xls'].includes(ext) ||
      contentType?.includes('csv') || contentType?.includes('spreadsheet')) {
    return 'data';
  }

  return 'other';
}

/**
 * Chooses the inline viewer for a blob. Azure often returns
 * `application/octet-stream`, so the extension is the authoritative fallback.
 */
export function getViewerKind(blob: Pick<BlobMetadata, 'name' | 'contentType'>): ViewerKind | null {
  const ext = blob.name.split('.').pop()?.toLowerCase() || '';
  const mime = (blob.contentType || '').toLowerCase();

  if (ext === 'pdf' || mime.includes('pdf')) return 'pdf';
  if (IMAGE_EXTENSIONS.has(ext) || mime.startsWith('image/')) return 'image';
  if (VIDEO_EXTENSIONS.has(ext) || mime.startsWith('video/')) return 'video';
  if (
    TEXT_EXTENSIONS.has(ext) ||
    mime.startsWith('text/') ||
    mime.includes('json') ||
    mime.includes('xml') ||
    mime.includes('javascript') ||
    mime.includes('x-www-form-urlencoded')
  ) {
    return 'text';
  }

  return null;
}

export function getGlyphBadge(name: string): { label: string; ext: string } {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!ext || ext === name.toLowerCase()) {
    return { label: 'BIN', ext: '' };
  }
  return {
    label: ext.slice(0, 4).toUpperCase(),
    ext,
  };
}
