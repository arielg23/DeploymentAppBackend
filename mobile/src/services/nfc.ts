import NfcManager, {NfcEvents, NfcTech, Ndef} from 'react-native-nfc-manager';

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

export const readNfcTag = (): Promise<string> =>
  new Promise(async (resolve, reject) => {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      if (!tag?.ndefMessage?.length) {
        await NfcManager.cancelTechnologyRequest();
        reject(new Error('No NDEF message on tag'));
        return;
      }
      const record = tag.ndefMessage[0];
      const payload = Ndef.text.decodePayload(new Uint8Array(record.payload));
      await NfcManager.cancelTechnologyRequest();
      resolve(payload.trim());
    } catch (e) {
      await NfcManager.cancelTechnologyRequest().catch(() => {});
      reject(e);
    }
  });

export const cancelNfcRead = () => NfcManager.cancelTechnologyRequest().catch(() => {});
