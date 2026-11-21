import type { BlobMetadata } from '../../types';
import { formatBytes, formatDate, formatIndex } from '../../lib/format';
import { FileGlyph } from './FileGlyph';
import './BlobGrid.css';

export interface BlobGridProps {
  blobs: BlobMetadata[];
  startIndex: number;
  selectedKeys: Set<string>;
  onToggleSelect: (name: string, index: number, shiftKey: boolean) => void;
  onDownload: (name: string) => void;
}

export function BlobGrid({ blobs, startIndex, selectedKeys, onToggleSelect, onDownload }: BlobGridProps) {
  return (
    <div className="depot-blob-grid">
      {blobs.map((blob, idx) => (
        <button
          key={blob.name}
          type="button"
          className={`depot-blob-card ${selectedKeys.has(blob.name) ? 'is-selected' : ''}`}
          onClick={(e) => onToggleSelect(blob.name, startIndex + idx, e.shiftKey)}
          onDoubleClick={() => onDownload(blob.name)}
          title={`${blob.name} — double-click to download`}
        >
          <div className="depot-card-top">
            <span className="depot-card-num font-mono">{formatIndex(startIndex + idx + 1)}</span>
            <input
              type="checkbox"
              checked={selectedKeys.has(blob.name)}
              onChange={() => onToggleSelect(blob.name, startIndex + idx, false)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${blob.name}`}
            />
          </div>
          <div className="depot-card-glyph">
            <FileGlyph name={blob.name} contentType={blob.contentType} size="lg" />
          </div>
          <div className="depot-card-name font-mono" title={blob.name}>{blob.name}</div>
          <div className="depot-card-meta font-mono">
            <span>{formatBytes(blob.size)}</span>
            <span className="dotted-leader" />
            <span>{formatDate(blob.lastModified).split(' ')[0]}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
