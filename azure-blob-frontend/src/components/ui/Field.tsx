import React from 'react';
import './Field.css';

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}

export function Field({ id, label, hint, error, optional, children }: FieldProps) {
  return (
    <div className={`depot-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id} className="depot-field-label">
        {label}
        {optional && <span className="depot-field-optional"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="depot-field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="depot-field-hint">{hint}</p>
      )}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className = '', ...props }: InputProps) {
  return (
    <input
      className={`depot-input ${invalid ? 'is-invalid' : ''} ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function TextArea({ invalid, className = '', ...props }: TextAreaProps) {
  return (
    <textarea
      className={`depot-input depot-textarea ${invalid ? 'is-invalid' : ''} ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
