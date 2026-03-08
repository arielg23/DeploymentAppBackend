import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';

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

function uidToHex(id: any): string {
  if (!id) return '0000000000000000';
  try {
    const bytes: number[] = Array.from(id);
    const raw = bytes.map(b => (b & 0xFF).toString(16).padStart(2, '0')).join('').toUpperCase();
    return raw.padEnd(16, '0').substring(0, 16);
  } catch {
    return '0000000000000000';
  }
}

// Single requestTechnology call with multiple tech types — user taps once,
// Android picks whichever technology the tag supports (Ndef, NfcA, or NfcB).
export const readNfcTag = (): Promise<string> =>
  new Promise(async (resolve, reject) => {
    try {
      // Pass an array: Android uses the first matching technology
      await NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NfcA, NfcTech.NfcB] as any);
      const tag = await NfcManager.getTag();
      await NfcManager.cancelTechnologyRequest();

      // Prefer NDEF text payload (actual lock DevEUI)
      if (tag?.ndefMessage?.length) {
        try {
          const record = tag.ndefMessage[0];
          const payload = Ndef.text.decodePayload(new Uint8Array(record.payload as any));
          if (payload && payload.trim().length > 0) {
            resolve(payload.trim());
            return;
          }
        } catch {
          // Not a text record — fall through to UID
        }
      }

      // Fall back to tag UID (works for credit cards, bus cards, plain NFC chips)
      if (tag?.id) {
        resolve(uidToHex(tag.id));
        return;
      }

      reject(new Error('Could not read any identifier from this tag'));
    } catch (e: any) {
      await NfcManager.cancelTechnologyRequest().catch(() => {});
      reject(new Error(e?.message || 'Failed to read NFC tag'));
    }
  });

export const cancelNfcRead = () => NfcManager.cancelTechnologyRequest().catch(() => {});
