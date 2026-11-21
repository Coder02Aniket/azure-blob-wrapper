import { useState, type FormEvent } from 'react';
import { KeyRound, Lock, Save, RotateCcw, ShieldAlert } from 'lucide-react';
import type { BlobConfig } from '../../types';
import { Drawer } from '../ui/Drawer';
import { Field, Input } from '../ui/Field';
import { Button } from '../ui/Button';
import './ConnectionDrawer.css';

export interface ConnectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: BlobConfig;
  onSave: (config: BlobConfig) => void;
  onReset: () => void;
  isCustomConfig: boolean;
}

interface ConnectionFormProps {
  config: BlobConfig;
  onClose: () => void;
  onSave: (config: BlobConfig) => void;
  onReset: () => void;
  isCustomConfig: boolean;
}

function ConnectionForm({ config, onClose, onSave, onReset, isCustomConfig }: ConnectionFormProps) {
  const [draft, setDraft] = useState<BlobConfig>(config);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      ...draft,
      connectionString: draft.connectionString.trim(),
      containerName: draft.containerName.trim(),
      endpoint: draft.endpoint?.trim() || undefined,
    });
    onClose();
  };

  return (
    <form className="depot-config-form" onSubmit={handleSubmit}>
      <div className="depot-config-notice">
        <ShieldAlert size={15} />
        <p>
          The connection string is sent with each request and stored only for this browser session.
          Enable <strong>Remember</strong> to keep it in local storage — only do this on a trusted device.
        </p>
      </div>

      <Field
        id="cfg-container"
        label="Container name"
        hint="Overrides X-Azure-Container-Name. Leave as-is to use the backend default."
      >
        <Input
          id="cfg-container"
          className="font-mono"
          value={draft.containerName}
          onChange={(e) => setDraft({ ...draft, containerName: e.target.value })}
          placeholder="demo-container"
          autoComplete="off"
        />
      </Field>

      <Field
        id="cfg-connection"
        label="Connection string"
        hint="Sent as the X-Azure-Connection-String header. Never stored on the server."
      >
        <Input
          id="cfg-connection"
          type="password"
          className="font-mono"
          value={draft.connectionString}
          onChange={(e) => setDraft({ ...draft, connectionString: e.target.value })}
          placeholder="DefaultEndpointsProtocol=https;AccountName=…"
          autoComplete="off"
          spellCheck={false}
        />
      </Field>

      <Field id="cfg-endpoint" label="API endpoint" optional hint="Leave empty to use the current origin (/api).">
        <Input
          id="cfg-endpoint"
          className="font-mono"
          value={draft.endpoint ?? ''}
          onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })}
          placeholder="https://api.example.com"
          autoComplete="off"
        />
      </Field>

      <label className="depot-config-check">
        <input
          type="checkbox"
          checked={draft.remember ?? false}
          onChange={(e) => setDraft({ ...draft, remember: e.target.checked })}
        />
        <span className="depot-config-check-copy">
          <span className="depot-config-check-title">Remember on this device</span>
          <span className="depot-config-check-hint">
            <Lock size={11} /> Opt-in only · stores the connection string in local storage
          </span>
        </span>
      </label>

      <div className="depot-config-actions">
        <Button type="submit" variant="primary" icon={<Save size={14} />}>
          Save connection
        </Button>
        <Button type="button" variant="ghost" icon={<RotateCcw size={14} />} onClick={onReset} disabled={!isCustomConfig}>
          Clear saved values
        </Button>
      </div>

      <div className="depot-config-footnote font-mono">
        <KeyRound size={12} /> Credentials never leave this browser except with each API request.
      </div>
    </form>
  );
}

export function ConnectionDrawer({
  isOpen,
  onClose,
  config,
  onSave,
  onReset,
  isCustomConfig,
}: ConnectionDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Connection"
      subtitle="Where the ledger reads and writes objects"
    >
      <ConnectionForm
        config={config}
        onSave={onSave}
        onClose={onClose}
        onReset={onReset}
        isCustomConfig={isCustomConfig}
      />
    </Drawer>
  );
}
