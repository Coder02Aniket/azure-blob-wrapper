import { Check, RotateCw, X, Upload } from 'lucide-react';
import type { UploadItem } from '../../types';
import { formatBytes } from '../../lib/format';
import { FileGlyph } from '../blobs/FileGlyph';
import { IconButton } from '../ui/IconButton';
import './UploadQueue.css';

export interface UploadQueueProps {
  items: UploadItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
  onClearCompleted: () => void;
}

export function UploadQueue({ items, onCancel, onRetry, onDismiss, onClearCompleted }: UploadQueueProps) {
  if (items.length === 0) return null;

  const completed = items.filter((item) => item.status === 'done' || item.status === 'error').length;

  return (
    <section className="depot-queue" aria-label="Upload queue">
      <div className="depot-queue-header">
        <div className="depot-queue-title">
          <Upload size={14} />
          <span className="font-mono">UPLOAD QUEUE</span>
          <span className="depot-queue-count font-mono">{items.length}</span>
          {completed > 0 && (
            <button type="button" className="depot-queue-clear" onClick={onClearCompleted}>
              Clear finished
            </button>
          )}
        </div>
      </div>
      <ul className="depot-queue-list">
        {items.map((item) => (
          <li key={item.id} className={`depot-queue-item depot-queue-${item.status}`}>
            <div className="depot-queue-glyph"><FileGlyph name={item.file.name} size="sm" /></div>
            <div className="depot-queue-body">
              <div className="depot-queue-name font-mono" title={item.file.name}>{item.file.name}</div>
              <div className="depot-queue-detail font-mono">
                <span>{formatBytes(item.file.size)}</span>
                <span className="depot-queue-dot">·</span>
                <span>
                  {item.status === 'uploading' && `${item.progress}%`}
                  {item.status === 'queued' && 'queued'}
                  {item.status === 'done' && 'stored'}
                  {item.status === 'error' && 'failed'}
                  {item.status === 'canceled' && 'canceled'}
                </span>
                {item.detail && (
                  <>
                    <span className="depot-queue-dot">·</span>
                    <span className="depot-queue-mode">{item.detail}</span>
                  </>
                )}
                {item.error && <span className="depot-queue-error-text" title={item.error}>{item.error}</span>}
              </div>
              {item.status === 'uploading' && (
                <div
                  className="depot-queue-progress"
                  role="progressbar"
                  aria-valuenow={item.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Uploading ${item.file.name}`}
                >
                  <span style={{ width: `${item.progress}%` }} />
                </div>
              )}
            </div>
            <div className="depot-queue-actions">
              {item.status === 'uploading' && (
                <IconButton label={`Cancel upload ${item.file.name}`} variant="ghost" size="sm" onClick={() => onCancel(item.id)}>
                  <X size={14} />
                </IconButton>
              )}
              {item.status === 'error' && (
                <>
                  <IconButton label={`Retry ${item.file.name}`} variant="ghost" size="sm" onClick={() => onRetry(item.id)}>
                    <RotateCw size={14} />
                  </IconButton>
                  <IconButton label={`Dismiss ${item.file.name}`} variant="ghost" size="sm" onClick={() => onDismiss(item.id)}>
                    <X size={14} />
                  </IconButton>
                </>
              )}
              {item.status === 'done' && (
                <Check size={14} className="depot-queue-check" aria-label="Upload complete" />
              )}
              {item.status === 'canceled' && (
                <IconButton label={`Dismiss ${item.file.name}`} variant="ghost" size="sm" onClick={() => onDismiss(item.id)}>
                  <X size={14} />
                </IconButton>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
