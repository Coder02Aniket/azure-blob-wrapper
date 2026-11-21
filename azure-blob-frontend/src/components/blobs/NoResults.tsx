import { Search } from 'lucide-react';
import { Button } from '../ui/Button';
import './States.css';

export function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="depot-state-panel" role="status">
      <div className="depot-state-error-icon" aria-hidden="true"><Search size={28} /></div>
      <h2 className="depot-state-title">No matching objects</h2>
      <p className="depot-state-desc">
        Nothing in the manifest matches <strong className="font-mono">"{query}"</strong> with the current filter.
      </p>
      <Button variant="secondary" onClick={onClear}>Clear filters</Button>
    </div>
  );
}
