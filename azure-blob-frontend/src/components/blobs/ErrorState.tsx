import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import './States.css';

export interface ErrorStateProps {
  message: string;
  endpoint?: string;
  onRetry: () => void;
  onSettings: () => void;
}

export function ErrorState({ message, endpoint, onRetry, onSettings }: ErrorStateProps) {
  return (
    <div className="depot-state-panel depot-state-error" role="alert">
      <div className="depot-state-error-icon" aria-hidden="true"><AlertTriangle size={28} /></div>
      <h2 className="depot-state-title">Cannot reach storage</h2>
      <p className="depot-state-desc">{message}</p>
      {endpoint && (
        <p className="depot-state-endpoint font-mono">{endpoint}</p>
      )}
      <div className="depot-state-actions">
        <Button variant="primary" icon={<RefreshCw size={14} />} onClick={onRetry}>Retry</Button>
        <Button variant="secondary" icon={<Settings size={14} />} onClick={onSettings}>Check connection</Button>
      </div>
    </div>
  );
}
