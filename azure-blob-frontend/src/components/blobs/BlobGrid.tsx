import type { BlobMetadata } from '../../types';
import { formatBytes, formatDate, formatIndex } from '../../lib/format';
import { getViewerKind } from '../../lib/blob';
import { FileGlyph } from './FileGlyph';
import { IconButton } from '../ui/IconButton';
import { Eye } from 'lucide-react';
import './BlobGrid.css';

export interface BlobGridProps {
  blobs: BlobMetadata[];
  startIndex: number;
  selectedKeys: Set<string>;
  onToggleSelect: (name: string, index: number, shiftKey: boolean) => void;
  onView: (blob: BlobMetadata) => void;
  onDownload: (name: string) => void;
}

export function BlobGrid({ blobs, startIndex, selectedKeys, onToggleSelect, onView, onDownload }: BlobGridProps) {
  return (
    <div className="depot-blob-grid">
      {blobs.map((blob, idx) => {
        const viewable = Boolean(getViewerKind(blob));
        return (
          <div key={blob.name} className={`depot-blob-card ${selectedKeys.has(blob.name) ? 'is-selected' : ''}`}>
            <div className="depot-card-top">
              <span className="depot-card-num font-mono">{formatIndex(startIndex + idx + 1)}</span>
              <div className="depot-card-controls">
                {viewable && (
                  <IconButton
                    label={`Preview ${blob.name}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(blob)}
                  >
                    <Eye size={13} />
                  </IconButton>
                )}
                <input
                  type="checkbox"
                  checked={selectedKeys.has(blob.name)}
                  onChange={() => onToggleSelect(blob.name, startIndex + idx, false)}
                  aria-label={`Select ${blob.name}`}
                />
              </div>
            </div>

            <button
              type="button"
              className="depot-card-open"
              onClick={(e) => onToggleSelect(blob.name, startIndex + idx, e.shiftKey)}
              onDoubleClick={() => {
                if (viewable) onView(blob);
                else onDownload(blob.name);
              }}
              title={`${blob.name} — double-click to ${viewable ? 'preview' : 'download'}`}
            >
              <span className="depot-card-glyph">
                <FileGlyph name={blob.name} contentType={blob.contentType} size="lg" />
              </span>
              <span className="depot-card-name font-mono" title={blob.name}>{blob.name}</span>
              <span className="depot-card-meta font-mono">
                <span>{formatBytes(blob.size)}</span>
                <span className="dotted-leader" />
                <span>{formatDate(blob.lastModified).split(' ')[0]}</span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
