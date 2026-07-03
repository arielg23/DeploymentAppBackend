import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';

export const NFC_PASSCODE = '12345';

// How long to wait after writing passcode for the lock to process and respond.
// The field drop (cancelTechnologyRequest) triggers the lock's MCU.
// 600ms is enough for most locks; increase if reads fail after write.
const LOCK_PROCESS_DELAY_MS = 600;

let initialized = false;

export const initNfc = async (): Promise<boolean> => {
  if (initialized) return true;
  try {
    const supported = await NfcManager.isSupported();
    if (!supported) return false;
    await NfcManager.start();
    initialized = true;
    return true;
  } catch {
    return false;
  }
};

export const isNfcEnabled = (): Promise<boolean> => NfcManager.isEnabled();

function bytesToHex(bytes: number[]): string {
  return bytes.map(b => (b & 0xFF).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function extractUid(tag: any): string | null {
  if (!tag?.id) return null;
  try {
    const bytes: number[] = Array.from(tag.id);
    if (bytes.length !== 8) return null;
    return bytesToHex(bytes);
  } catch {
    return null;
  }
}

function extractNdefDeveui(tag: any): string | null {
  if (!tag?.ndefMessage?.length) return null;
  try {
    for (const record of tag.ndefMessage) {
      try {
        const text = Ndef.text.decodePayload(new Uint8Array(record.payload as any));
        if (text) {
          const trimmed = text.trim();
          // Exact 16 hex chars
          if (/^[0-9A-Fa-f]{16}$/.test(trimmed)) {
            return trimmed.toUpperCase();
          }
          // Colon-separated: 00:80:E1:15:05:DD:B4:05 → strip colons
          const stripped = trimmed.replace(/:/g, '');
          if (/^[0-9A-Fa-f]{16}$/.test(stripped)) {
            return stripped.toUpperCase();
          }
          // Scan for 16 consecutive hex chars anywhere in text
          const match = trimmed.match(/[0-9A-Fa-f]{16}/);
          if (match) return match[0].toUpperCase();
        }
      } catch {}
    }
    // Scan all NDEF bytes for a 16 hex-char run
    const allBytes = tag.ndefMessage.flatMap((r: any) => Array.from(r.payload as any));
    const hex = bytesToHex(allBytes as number[]);
    const match = hex.match(/[0-9A-F]{16}/);
    if (match) return match[0];
  } catch {}
  return null;
}

// ── Single-tap write + read ───────────────────────────────────────────────────
// User holds phone on lock once:
//   1. Write NFCCODE:12345 → cancelTechnologyRequest drops NFC field
//      → lock's MCU detects field drop, processes command, writes DevEUI back
//   2. Wait LOCK_PROCESS_DELAY_MS for lock to process
//   3. Re-request technology (phone still on lock, re-detected automatically)
//   4. Read and return DevEUI
export const readNfcTag = (): Promise<string> =>
  new Promise(async (resolve, reject) => {
    try {
      // ── Write passcode ──────────────────────────────────────────────────
      await NfcManager.requestTechnology(NfcTech.Ndef as any);
      const bytes = Ndef.encodeMessage([Ndef.textRecord(`NFCCODE:${NFC_PASSCODE}`)]);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      // Drop the NFC field — this is what triggers the lock's MCU
      await NfcManager.cancelTechnologyRequest().catch(() => {});

      // ── Wait for lock to process ────────────────────────────────────────
      await new Promise(r => setTimeout(r, LOCK_PROCESS_DELAY_MS));

      // ── Read DevEUI (phone still on lock, auto-detected) ────────────────
      await NfcManager.requestTechnology([
        NfcTech.Ndef,
        NfcTech.NfcA,
        NfcTech.NfcB,
        NfcTech.NfcF,
        NfcTech.NfcV,
        NfcTech.IsoDep,
        NfcTech.MifareClassic,
        NfcTech.MifareUltralight,
      ] as any);

      const tag = await NfcManager.getTag();
      await NfcManager.cancelTechnologyRequest().catch(() => {});

      const ndefDeveui = extractNdefDeveui(tag);
      if (ndefDeveui) { resolve(ndefDeveui); return; }

      const uid = extractUid(tag);
      if (uid) { resolve(uid); return; }

      reject(new Error('Could not read DevEUI from this tag'));
    } catch (e: any) {
      await NfcManager.cancelTechnologyRequest().catch(() => {});
      reject(new Error(e?.message || 'Failed to read NFC tag'));
    }
  });

export const cancelNfcRead = () =>
  NfcManager.cancelTechnologyRequest().catch(() => {});
