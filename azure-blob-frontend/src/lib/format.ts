export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  if (isNaN(bytes) || bytes < 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  const value = parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm));

  return `${value} ${sizes[safeI]}`;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());

    return `${year}-${month}-${day} ${hours}:${mins}`;
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 0) return formatDate(isoString);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return formatDate(isoString);
  } catch {
    return isoString;
  }
}

export function formatIndex(idx: number): string {
  return idx.toString().padStart(3, '0');
}

export function formatKeyParts(key: string): { dir: string; leaf: string } {
  const lastSlash = key.lastIndexOf('/');
  if (lastSlash === -1) {
    return { dir: '', leaf: key };
  }
  return {
    dir: key.slice(0, lastSlash + 1),
    leaf: key.slice(lastSlash + 1),
  };
}
