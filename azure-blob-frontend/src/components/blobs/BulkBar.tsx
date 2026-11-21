import { Trash2, Copy, X, CheckSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import './BulkBar.css';

export interface BulkBarProps {
  selectedCount: number;
  onDelete: () => void;
  onCopyKeys: () => void;
  onClear: () => void;
  isDeleting?: boolean;
}

export function BulkBar({ selectedCount, onDelete, onCopyKeys, onClear, isDeleting }: BulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="depot-bulk-bar" role="region" aria-label="Bulk actions">
      <div className="depot-bulk-count">
        <CheckSquare size={15} />
        <strong className="font-mono">{selectedCount}</strong>
        <span>{selectedCount === 1 ? 'selected' : 'selected'}</span>
      </div>
      <div className="depot-bulk-actions">
        <Button size="sm" variant="secondary" icon={<Copy size={13} />} onClick={onCopyKeys}>
          Copy keys
        </Button>
        <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={onDelete} loading={isDeleting}>
          Delete
        </Button>
        <IconButton label="Clear selection" size="sm" variant="ghost" onClick={onClear}>
          <X size={15} />
        </IconButton>
      </div>
    </div>
  );
}
