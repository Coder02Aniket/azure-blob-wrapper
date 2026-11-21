import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`depot-btn depot-btn-${variant} depot-btn-${size} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="depot-btn-spinner" aria-hidden="true" />
      ) : (
        icon && iconPosition === 'left' && <span className="depot-btn-icon">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="depot-btn-icon">{icon}</span>
      )}
    </button>
  );
}
