import { Layers3, HardDrive, Keyboard, Moon, Sun, Settings } from 'lucide-react';
import type { ThemeMode } from '../../hooks/useTheme';
import './Rail.css';

export interface RailProps {
  objectCount: number;
  totalBytesLabel: string;
  environmentLabel: string;
  containerName: string;
  theme: ThemeMode;
  onThemeToggle: () => void;
  onSettings: () => void;
  onShortcuts: () => void;
}

export function Rail({
  objectCount,
  totalBytesLabel,
  environmentLabel,
  containerName,
  theme,
  onThemeToggle,
  onSettings,
  onShortcuts,
}: RailProps) {
  return (
    <aside className="depot-rail" aria-label="Application navigation">
      <div className="depot-rail-brand">
        <div className="depot-rail-mark" aria-hidden="true">
          <Layers3 size={20} />
        </div>
        <div className="depot-rail-wordmark">
          <span className="depot-wordmark-line1">DEPOT</span>
          <span className="depot-wordmark-line2">LEDGER</span>
        </div>
      </div>

      <div className="depot-rail-env">
        <div className="depot-rail-env-row">
          <span className="depot-rail-env-label font-mono">ENV</span>
          <span className="depot-env-chip"><HardDrive size={11} /> {environmentLabel}</span>
        </div>
        <div className="depot-rail-env-row">
          <span className="depot-rail-env-label font-mono">CONT</span>
          <span className="depot-rail-container font-mono" title={containerName}>
            {containerName}
          </span>
        </div>
      </div>

      <div className="depot-rail-stat">
        <div className="depot-rail-stat-row">
          <span className="font-mono">{String(objectCount).padStart(3, '0')}</span>
          <span className="dotted-leader" />
          <span>objects</span>
        </div>
        <div className="depot-rail-stat-row">
          <span className="font-mono">{totalBytesLabel}</span>
          <span className="dotted-leader" />
          <span>stored</span>
        </div>
      </div>

      <nav className="depot-rail-nav" aria-label="Shortcuts">
        <span className="depot-rail-section-label font-mono">SHORTCUTS</span>
        <button type="button" className="depot-rail-link" onClick={onShortcuts}>
          <Keyboard size={15} /> <span>Keyboard map</span>
          <kbd className="font-mono">?</kbd>
        </button>
        <button type="button" className="depot-rail-link" onClick={onSettings}>
          <Settings size={15} /> <span>Connection</span>
          <kbd className="font-mono">,</kbd>
        </button>
      </nav>

      <div className="depot-rail-footer">
        <button
          type="button"
          className="depot-rail-link"
          onClick={onThemeToggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'} theme</span>
          <kbd className="font-mono">T</kbd>
        </button>
        <div className="depot-rail-footnote font-mono">v1.0 · AZURE BLOB</div>
      </div>
    </aside>
  );
}
