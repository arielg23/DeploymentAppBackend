const DEVEUI_RE = /^[0-9A-Fa-f]{16}$/;

export const normalizeDevEui = (raw: string): string =>
  raw.toUpperCase().replace(/[:\-\s]/g, '');

export const validateDevEui = (raw: string): {valid: boolean; normalized: string; error?: string} => {
  const normalized = normalizeDevEui(raw);
  if (!DEVEUI_RE.test(normalized)) {
    return {valid: false, normalized, error: `Invalid DevEUI format. Expected 16 hex characters, got: "${normalized}"`};
  }
  return {valid: true, normalized};
};
