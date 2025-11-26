export interface Config {
  allowAnnotations?: boolean;
  allowTextEditing?: boolean;
  maxFileSize?: number; // in MB
  allowedFileTypes?: string[];
}

export function validateConfig(config: unknown): config is Config {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const c = config as Record<string, unknown>;

  if (c.allowAnnotations !== undefined && typeof c.allowAnnotations !== 'boolean') {
    return false;
  }

  if (c.allowTextEditing !== undefined && typeof c.allowTextEditing !== 'boolean') {
    return false;
  }

  if (c.maxFileSize !== undefined && typeof c.maxFileSize !== 'number') {
    return false;
  }

  if (c.allowedFileTypes !== undefined && !Array.isArray(c.allowedFileTypes)) {
    return false;
  }

  return true;
}

