import { UploadCloud } from 'lucide-react';
import './DropOverlay.css';

export function DropOverlay({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="depot-drop-overlay" role="presentation" aria-hidden="true">
      <div className="depot-drop-box">
        <UploadCloud size={56} strokeWidth={1.5} />
        <p className="depot-drop-title font-mono">DROP TO STAGE</p>
        <p className="depot-drop-sub">Files up to 100 MB · multiple files supported</p>
      </div>
    </div>
  );
}
