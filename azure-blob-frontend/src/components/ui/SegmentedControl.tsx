import React from 'react';
import './SegmentedControl.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div className="depot-segmented-control" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`depot-segment-btn ${isSelected ? 'is-selected' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.icon && <span className="depot-segment-icon">{option.icon}</span>}
            <span className="depot-segment-label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
