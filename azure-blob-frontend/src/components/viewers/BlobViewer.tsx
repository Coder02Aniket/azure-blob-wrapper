import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  ScanEye,
  X,
} from 'lucide-react';
import type { BlobConfig, BlobMetadata, ViewerKind } from '../../types';
import { fetchBlobForPreview } from '../../lib/api';
import { getViewerKind } from '../../lib/blob';
import { formatBytes, formatDate, formatKeyParts } from '../../lib/format';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import './BlobViewer.css';

const TEXT_PREVIEW_LIMIT = 2 * 1024 * 1024;

const KIND_META: Record<ViewerKind, { label: string; icon: ReactNode }> = {
  image: { label: 'IMAGE PLATE', icon: <ImageIcon size={17} /> },
  video: { label: 'MOTION REEL', icon: <Film size={17} /> },
  pdf: { label: 'PRINT PROOF', icon: <FileText size={17} /> },
  text: { label: 'MANUSCRIPT', icon: <FileText size={17} /> },
};

type PreviewState =
  | { status: 'loading' }
  | { status: 'ready'; url?: string; text?: string }
  | { status: 'error'; message: string }
  | { status: 'too-large' };

export interface BlobViewerProps {
  blob: BlobMetadata;
  config: BlobConfig;
  onClose: () => void;
  onDownload: (name: string) => void;
}

export function BlobViewer({ blob, config, onClose, onDownload }: BlobViewerProps) {
  const kind = getViewerKind(blob);
  const panelRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ status: 'loading' });

  useEffect(() => {
    if (!kind) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await fetchBlobForPreview(blob.name, config, controller.signal);
        if (controller.signal.aborted) return;

        if (kind === 'text') {
          if (data.size > TEXT_PREVIEW_LIMIT) {
            setPreview({ status: 'too-large' });
            return;
          }
          const text = await data.text();
          if (!controller.signal.aborted) setPreview({ status: 'ready', text });
          return;
        }

        // Azure frequently reports octet-stream; borrow the manifest type when it is specific.
        const typed =
          blob.contentType && blob.contentType !== 'application/octet-stream'
            ? data.slice(0, data.size, blob.contentType)
            : data;
        const url = window.URL.createObjectURL(typed);
        objectUrlRef.current = url;
        setPreview({ status: 'ready', url });
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setPreview({
            status: 'error',
            message: err instanceof Error ? err.message : 'The preview could not be loaded.',
          });
        }
      }
    };

    void load();

    return () => {
      controller.abort();
      if (objectUrlRef.current) {
        window.URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [blob.name, blob.contentType, config, kind]);

  useEffect(() => {
    panelRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const leaf = formatKeyParts(blob.name).leaf;
  const meta = kind ? KIND_META[kind] : null;

  const renderCanvas = () => {
    if (!kind || !meta) {
      return (
        <div className="depot-viewer-message">
          <ScanEye size={34} strokeWidth={1.4} />
          <h3>No inline viewer for this format</h3>
          <p>This object can still be downloaded and opened locally.</p>
          <Button variant="primary" icon={<Download size={14} />} onClick={() => onDownload(blob.name)}>
            Download object
          </Button>
        </div>
      );
    }

    if (preview.status === 'loading') {
      return (
        <div className="depot-viewer-message" role="status">
          <span className="depot-viewer-loader" aria-hidden="true" />
          <h3>Developing preview…</h3>
          <p className="font-mono">FETCHING {formatBytes(blob.size)} FROM CONTAINER</p>
        </div>
      );
    }

    if (preview.status === 'error') {
      return (
        <div className="depot-viewer-message depot-viewer-failure" role="alert">
          <FileText size={34} strokeWidth={1.4} />
          <h3>Preview unavailable</h3>
          <p>{preview.message}</p>
          <Button variant="secondary" icon={<Download size={14} />} onClick={() => onDownload(blob.name)}>
            Download instead
          </Button>
        </div>
      );
    }

    if (preview.status === 'too-large') {
      return (
        <div className="depot-viewer-message">
          <FileText size={34} strokeWidth={1.4} />
          <h3>Text is too large to display</h3>
          <p>
            Previews are limited to {formatBytes(TEXT_PREVIEW_LIMIT, 0)}. Download the object to read
            it locally.
          </p>
          <Button variant="primary" icon={<Download size={14} />} onClick={() => onDownload(blob.name)}>
            Download object
          </Button>
        </div>
      );
    }

    if (kind === 'image') {
      return <img className="depot-viewer-image" src={preview.url} alt={blob.name} />;
    }

    if (kind === 'video') {
      return <video className="depot-viewer-video" src={preview.url} controls playsInline preload="metadata" />;
    }

    if (kind === 'pdf') {
      return (
        <iframe
          className="depot-viewer-frame"
          src={preview.url}
          title={`PDF preview of ${leaf}`}
        />
      );
    }

    return (
      <pre className="depot-viewer-text font-mono" tabIndex={0}>
        {preview.text || ''}
      </pre>
    );
  };

  return (
    <div className="depot-viewer-overlay" onClick={onClose} role="presentation">
      <div
        className="depot-viewer-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${blob.name}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="depot-viewer-spine" aria-label="Object details">
          <div className="depot-viewer-stamp font-mono">
            <span>DEPOT</span>
            <span>INSPECTION</span>
            <span>COPY</span>
          </div>
          <dl className="depot-viewer-meta font-mono">
            <div><dt>KIND</dt><dd>{meta?.label ?? 'BINARY'}</dd></div>
            <div><dt>SIZE</dt><dd>{formatBytes(blob.size)}</dd></div>
            <div><dt>TYPE</dt><dd>{blob.contentType.split('/').pop()?.toUpperCase() || 'BIN'}</dd></div>
            <div><dt>MOD</dt><dd>{formatDate(blob.lastModified)}</dd></div>
          </dl>
          <div className="depot-viewer-spine-foot font-mono">{formatBytes(blob.size)} / {blob.etag.slice(0, 8) || 'NOETAG'}</div>
        </aside>

        <div className="depot-viewer-stage">
          <header className="depot-viewer-head">
            <div className="depot-viewer-heading">
              <span className="depot-viewer-kind-icon">{meta?.icon ?? <ScanEye size={17} />}</span>
              <div className="depot-viewer-heading-copy">
                <p className="depot-viewer-kicker font-mono">{meta?.label ?? 'UNSUPPORTED FORMAT'}</p>
                <h2 className="depot-viewer-title font-mono" title={blob.name}>{leaf}</h2>
              </div>
            </div>
            <div className="depot-viewer-tools">
              <Button size="sm" variant="secondary" icon={<Download size={14} />} onClick={() => onDownload(blob.name)}>
                Download
              </Button>
              <IconButton label="Close preview" variant="ghost" onClick={onClose}>
                <X size={18} />
              </IconButton>
            </div>
          </header>

          <div className="depot-viewer-canvas">{renderCanvas()}</div>
        </div>
      </div>
    </div>
  );
}
