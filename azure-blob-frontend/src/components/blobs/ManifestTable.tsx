import type { BlobMetadata, SortField } from '../../types';
import { formatBytes, formatDate, formatIndex, formatKeyParts } from '../../lib/format';
import { FileGlyph } from './FileGlyph';
import { IconButton } from '../ui/IconButton';
import { Download, Trash2, Copy } from 'lucide-react';
import './ManifestTable.css';

export interface ManifestTableProps {
  blobs: BlobMetadata[];
  startIndex: number;
  selectedKeys: Set<string>;
  onToggleSelect: (name: string, index: number, shiftKey: boolean) => void;
  onSelectAll: () => void;
  allSelected: boolean;
  onDownload: (name: string) => void;
  onDelete: (name: string) => void;
  onCopy: (name: string) => void;
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
}

export function ManifestTable({
  blobs,
  startIndex,
  selectedKeys,
  onToggleSelect,
  onSelectAll,
  allSelected,
  onDownload,
  onDelete,
  onCopy,
  sortField,
  sortDirection,
}: ManifestTableProps) {
  const sortMark = (field: SortField) =>
    sortField === field ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="depot-table-wrap">
      <table className="depot-manifest-table">
        <caption className="sr-only">Blob storage manifest — select and manage objects</caption>
        <thead>
          <tr>
            <th scope="col" className="col-check">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                aria-label="Select all visible rows"
              />
            </th>
            <th scope="col" className="col-num font-mono">#</th>
            <th scope="col" className="col-glyph"><span className="sr-only">Type</span></th>
            <th scope="col" className="col-key font-mono">KEY {sortMark('name')}</th>
            <th scope="col" className="col-format font-mono">FORMAT</th>
            <th scope="col" className="col-size font-mono">SIZE {sortMark('size')}</th>
            <th scope="col" className="col-date font-mono">MODIFIED {sortMark('lastModified')}</th>
            <th scope="col" className="col-actions"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {blobs.map((blob, idx) => {
            const parts = formatKeyParts(blob.name);
            const selected = selectedKeys.has(blob.name);
            return (
              <tr
                key={blob.name}
                className={selected ? 'is-selected' : ''}
                onClick={(e) => onToggleSelect(blob.name, startIndex + idx, e.shiftKey)}
              >
                <td className="col-check">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(blob.name, startIndex + idx, false)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${blob.name}`}
                  />
                </td>
                <td className="col-num font-mono">{formatIndex(startIndex + idx + 1)}</td>
                <td className="col-glyph"><FileGlyph name={blob.name} contentType={blob.contentType} size="sm" /></td>
                <td className="col-key font-mono" title={blob.name}>
                  {parts.dir && <span className="depot-key-dir">{parts.dir}</span>}
                  <span className="depot-key-leaf">{parts.leaf}</span>
                </td>
                <td className="col-format font-mono">{blob.contentType.split('/').pop()?.toUpperCase() || 'BIN'}</td>
                <td className="col-size font-mono">{formatBytes(blob.size)}</td>
                <td className="col-date font-mono">{formatDate(blob.lastModified)}</td>
                <td className="col-actions">
                  <div className="depot-row-actions">
                    <IconButton label={`Copy key ${blob.name}`} variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onCopy(blob.name); }}>
                      <Copy size={14} />
                    </IconButton>
                    <IconButton label={`Download ${blob.name}`} variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDownload(blob.name); }}>
                      <Download size={14} />
                    </IconButton>
                    <IconButton label={`Delete ${blob.name}`} variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(blob.name); }}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
