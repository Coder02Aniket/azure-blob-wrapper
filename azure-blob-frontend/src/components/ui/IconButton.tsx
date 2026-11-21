import React from 'react';
import './IconButton.css';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'default' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export function IconButton({
  label,
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      className={`depot-icon-btn depot-icon-btn-${variant} depot-icon-btn-${size} ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
