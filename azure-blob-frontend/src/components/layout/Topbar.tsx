import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import './Topbar.css';

export interface TopbarProps {
  title: string;
  subtitle: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function Topbar({ title, subtitle, isRefreshing, onRefresh }: TopbarProps) {
  return (
    <div className="depot-topbar">
      <div className="depot-topbar-heading">
        <h1 className="depot-topbar-title">{title}</h1>
        <p className="depot-topbar-subtitle">{subtitle}</p>
      </div>
      <div className="depot-topbar-actions">
        <Button
          size="sm"
          variant="secondary"
          icon={<RefreshCw size={14} className={isRefreshing ? 'is-spinning' : ''} />}
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
