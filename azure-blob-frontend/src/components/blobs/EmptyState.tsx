import { UploadCloud } from 'lucide-react';
import { Button } from '../ui/Button';
import './States.css';

export function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="depot-state-panel" role="status">
      <div className="depot-state-art" aria-hidden="true">
        <span className="depot-art-slab slab-1" />
        <span className="depot-art-slab slab-2" />
        <span className="depot-art-slab slab-3" />
      </div>
      <h2 className="depot-state-title">Container is empty</h2>
      <p className="depot-state-desc">
        No objects are stored in this container yet. Use the intake strip above or drop files anywhere
        on this page to add your first blob.
      </p>
      <Button variant="primary" icon={<UploadCloud size={15} />} onClick={onUpload}>
        Choose files
      </Button>
    </div>
  );
}
