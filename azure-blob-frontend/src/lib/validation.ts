export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileSize(size: number): ValidationResult {
  if (size <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File exceeds maximum upload limit of 100 MB.' };
  }
  return { valid: true };
}

export function validateContainerName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Container name cannot be empty.' };
  }
  if (trimmed.length < 3 || trimmed.length > 63) {
    return { valid: false, error: 'Container name must be between 3 and 63 characters.' };
  }
  const pattern = /^[a-z0-9](?!.*--)[a-z0-9-]{1,61}[a-z0-9]$/;
  if (!pattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Must contain only lowercase letters, numbers, and hyphens (no leading, trailing, or consecutive hyphens).',
    };
  }
  return { valid: true };
}

export function validateConnectionString(conn: string): ValidationResult {
  const trimmed = conn.trim();
  if (!trimmed) {
    return { valid: true }; // Empty defaults to local Azurite
  }
  if (trimmed.includes('UseDevelopmentStorage=true')) {
    return { valid: true };
  }
  if (!trimmed.includes('AccountName=') || (!trimmed.includes('AccountKey=') && !trimmed.includes('SharedAccessSignature='))) {
    return {
      valid: false,
      error: 'Connection string must include AccountName and either AccountKey or SharedAccessSignature.',
    };
  }
  return { valid: true };
}
