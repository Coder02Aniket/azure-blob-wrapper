import { useState, useCallback } from 'react';
import type { BlobConfig } from '../types';

const STORAGE_KEY = 'depot_blob_config';
const REMEMBER_KEY = 'depot_remember_config';

const DEFAULT_CONFIG: BlobConfig = {
  connectionString: '',
  containerName: 'your-container-name',
  remember: false,
};

function readInitialConfig(): BlobConfig {
  const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
  const storage = remember ? localStorage : sessionStorage;
  const raw = storage.getItem(STORAGE_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        remember,
      };
    } catch {
      // ignore
    }
  }

  return { ...DEFAULT_CONFIG, remember };
}

export function usePersistedConfig() {
  const [config, setConfigState] = useState<BlobConfig>(readInitialConfig);

  const saveConfig = useCallback((newConfig: BlobConfig) => {
    setConfigState(newConfig);

    if (newConfig.remember) {
      localStorage.setItem(REMEMBER_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    }
  }, []);

  const resetToDefault = useCallback(() => {
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setConfigState(DEFAULT_CONFIG);
  }, []);

  const isCustomConfig = Boolean(config.connectionString && config.connectionString.trim().length > 0);

  return {
    config,
    saveConfig,
    resetToDefault,
    isCustomConfig,
  };
}
