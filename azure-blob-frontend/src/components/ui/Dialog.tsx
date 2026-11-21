import React from 'react';
import './Dialog.css';

export interface DialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}

export function Dialog({
  dialogRef,
  title,
  description,
  children,
  onClose,
  maxWidth = '460px',
}: DialogProps) {
  return (
    <dialog ref={dialogRef} className="depot-dialog" style={{ maxWidth }} onClose={onClose}>
      <div className="depot-dialog-header">
        <h2 className="depot-dialog-title">{title}</h2>
        {description && <p className="depot-dialog-desc">{description}</p>}
      </div>
      <div className="depot-dialog-body">{children}</div>
    </dialog>
  );
}
