import type { FileCategory } from '../types';

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
