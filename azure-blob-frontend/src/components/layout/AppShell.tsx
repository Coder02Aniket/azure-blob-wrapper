import React from 'react';
import './AppShell.css';

export interface AppShellProps {
  rail: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ rail, children }: AppShellProps) {
  return (
    <div className="depot-app-shell">
      {rail}
      <div className="depot-app-main">{children}</div>
    </div>
  );
}
