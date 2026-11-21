import { UploadCloud, Plus } from 'lucide-react';
import './IntakeStrip.css';

export interface IntakeStripProps {
  isDragging: boolean;
  fileCount: number;
  onBrowse: () => void;
}

export function IntakeStrip({ isDragging, fileCount, onBrowse }: IntakeStripProps) {
  return (
    <div
      className={`depot-intake ${isDragging ? 'is-dragging' : ''} ${fileCount > 0 ? 'has-files' : ''}`}
      onClick={onBrowse}
      role="button"
      tabIndex={0}
      aria-label="Upload files — click to browse or drag files here"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onBrowse();
        }
      }}
    >
      <span className="depot-intake-glyph" aria-hidden="true">
        {fileCount > 0 ? <Plus size={18} /> : <UploadCloud size={18} />}
      </span>
      <div className="depot-intake-copy">
        <span className="depot-intake-title font-mono">
          {fileCount > 0 ? `${fileCount} file${fileCount !== 1 ? 's' : ''} in queue` : 'INTAKE'}
        </span>
        <span className="depot-intake-desc">
          {isDragging
            ? 'Release to stage files for upload'
            : 'Drop files anywhere, or click to browse · max 100 MB per object'}
        </span>
      </div>
      <span className="depot-intake-hint font-mono">DROP / BROWSE</span>
    </div>
  );
}
