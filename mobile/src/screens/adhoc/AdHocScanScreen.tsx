import React, {useState} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Camera, useCameraDevice, useCodeScanner} from 'react-native-vision-camera';
import {cancelNfcRead, initNfc, readNfcTag} from '../../services/nfc';
import {validateDevEui} from '../../services/deveui';
import {parseQRPayload} from '../../services/qrParser';
import {submitValidation} from '../../api/sites';
import {useSessionStore} from '../../store/sessionStore';

export const AdHocScanScreen = ({navigation}: any) => {
  const {selectedSite} = useSessionStore();
  const [tab, setTab] = useState<'nfc' | 'qr'>('nfc');
  const [reading, setReading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const device = useCameraDevice('back');

  const readNfc = async () => {
    setReading(true);
    await initNfc();
    try {
      const raw = await readNfcTag();
      const {valid, normalized} = validateDevEui(raw);
      if (!valid) { Alert.alert('Invalid DevEUI', 'Bad format'); setReading(false); return; }
      const result = await submitValidation({site_id: selectedSite!.site_id, dev_eui_normalized: normalized});
      setReading(false);
      navigation.navigate('AdHocConfirm', {result});
    } catch (e: any) {
      setReading(false);
      cancelNfcRead();
      if (e?.response?.status === 404) Alert.alert('Not Found', 'No assignment found for this lock');
      else Alert.alert('Error', e.message);
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'code-128'],
    onCodeScanned: async codes => {
      if (scanned || !codes[0]?.value) return;
      const payload = parseQRPayload(codes[0].value);
      if (!payload) return;
      setScanned(true);
      navigation.navigate('AdHocConfirm', {unitId: payload.unit_id, siteId: payload.site_id});
      setTimeout(() => setScanned(false), 2000);
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'nfc' && styles.activeTab]} onPress={() => setTab('nfc')}>
          <Text style={[styles.tabText, tab === 'nfc' && styles.activeTabText]}>NFC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'qr' && styles.activeTab]} onPress={() => setTab('qr')}>
          <Text style={[styles.tabText, tab === 'qr' && styles.activeTabText]}>QR / Barcode</Text>
        </TouchableOpacity>
      </View>

      {tab === 'nfc' ? (
        <View style={styles.nfcContainer}>
          <Text style={styles.nfcIcon}>📡</Text>
          <Text style={styles.instruction}>Tap to read lock NFC tag</Text>
          <TouchableOpacity style={[styles.button, reading && styles.buttonDisabled]} onPress={readNfc} disabled={reading}>
            <Text style={styles.buttonText}>{reading ? 'Reading...' : 'Read NFC'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        device ? (
          <View style={styles.cameraContainer}>
            <Camera style={StyleSheet.absoluteFill} device={device} isActive codeScanner={codeScanner} />
            <View style={styles.frameOverlay}><View style={styles.frame} /></View>
          </View>
        ) : <Text style={styles.noCamera}>Camera unavailable</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'},
  tabs: {flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA'},
  tab: {flex: 1, paddingVertical: 14, alignItems: 'center'},
  activeTab: {borderBottomWidth: 2, borderBottomColor: '#007AFF'},
  tabText: {fontSize: 15, color: '#8E8E93', fontWeight: '500'},
  activeTabText: {color: '#007AFF', fontWeight: '600'},
  nfcContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20},
  nfcIcon: {fontSize: 80},
  instruction: {fontSize: 16, color: '#3C3C43'},
  button: {backgroundColor: '#007AFF', borderRadius: 12, paddingHorizontal: 40, paddingVertical: 16},
  buttonDisabled: {backgroundColor: '#99C0FF'},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  cameraContainer: {flex: 1, position: 'relative'},
  frameOverlay: {position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center'},
  frame: {width: 200, height: 200, borderWidth: 2, borderColor: '#007AFF', borderRadius: 12},
  noCamera: {textAlign: 'center', marginTop: 40, color: '#8E8E93'},
});
