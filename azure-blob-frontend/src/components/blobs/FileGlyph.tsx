import { FileText, Film, FileArchive, Code2, Database, Image as ImageIcon, File as Generic } from 'lucide-react';
import { getFileCategory } from '../../lib/blob';
import './FileGlyph.css';

export interface FileGlyphProps {
  name: string;
  contentType?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FileGlyph({ name, contentType, size = 'md' }: FileGlyphProps) {
  const category = getFileCategory(name, contentType);
  const ext = name.split('.').pop()?.toLowerCase() || '';

  const Icon =
    category === 'documents' ? FileText :
    category === 'images' ? ImageIcon :
    category === 'media' ? Film :
    category === 'archives' ? FileArchive :
    category === 'code' ? Code2 :
    category === 'data' ? Database : Generic;

  return (
    <span className={`depot-glyph depot-glyph-${category} depot-glyph-${size}`} aria-hidden="true">
      <Icon size={size === 'sm' ? 16 : size === 'lg' ? 28 : 20} />
      {ext.length > 0 && ext.length <= 5 && ext !== name.toLowerCase() && (
        <span className="depot-glyph-ext font-mono">{ext.slice(0, 4).toUpperCase()}</span>
      )}
    </span>
  );
}
