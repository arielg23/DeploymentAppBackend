export interface QRPayload {
  site_id: string;
  unit_id: string;
}

export const parseQRPayload = (raw: string): QRPayload | null => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.site_id && parsed.unit_id) return {site_id: parsed.site_id, unit_id: parsed.unit_id};
    if (parsed.s && parsed.u) return {site_id: parsed.s, unit_id: parsed.u};
  } catch {}
  // Try colon-separated format: "SITE_ID:UNIT_ID"
  const parts = raw.split(':');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return {site_id: parts[0].trim(), unit_id: parts[1].trim()};
  }
  return null;
};
