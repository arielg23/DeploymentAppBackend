import React, {useCallback, useState} from 'react';
import {Alert, Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Camera, useCameraDevice, useCodeScanner} from 'react-native-vision-camera';
import {useSessionStore} from '../../store/sessionStore';
import {parseQRPayload} from '../../services/qrParser';

export const DeploymentScanQRScreen = ({navigation}: any) => {
  const {selectedSite} = useSessionStore();
  const [scanned, setScanned] = useState(false);
  const [mismatch, setMismatch] = useState<{expected?: string; found: string} | null>(null);
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'code-128', 'code-39'],
    onCodeScanned: codes => {
      if (scanned || !codes[0]?.value) return;
      const value = codes[0].value;
      const payload = parseQRPayload(value);

      if (!payload) {
        Alert.alert('Invalid QR', 'QR code does not contain valid unit information');
        return;
      }
      if (payload.site_id !== selectedSite?.site_id) {
        setMismatch({found: `${payload.site_id}:${payload.unit_id}`});
        return;
      }
      setScanned(true);
      navigation.navigate('DeploymentScanNFC', {unitId: payload.unit_id, siteId: payload.site_id});
      setTimeout(() => setScanned(false), 2000);
    },
  });

  if (!device) return <View style={styles.container}><Text>Camera not available</Text></View>;

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive codeScanner={codeScanner} />
      <View style={styles.overlay}>
        <Text style={styles.instruction}>Scan the unit QR sticker</Text>
        <View style={styles.frame} />
        <Text style={styles.hint}>Site: {selectedSite?.site_id}</Text>
      </View>

      {mismatch && (
        <Modal transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Wrong Sticker</Text>
              <Text style={styles.modalText}>This sticker is for: {mismatch.found}</Text>
              <Text style={styles.modalText}>Expected site: {selectedSite?.site_id}</Text>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setMismatch(null)}>
                <Text style={styles.modalBtnText}>Rescan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000'},
  overlay: {position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center'},
  instruction: {color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4},
  frame: {width: 220, height: 220, borderWidth: 2, borderColor: '#007AFF', borderRadius: 12},
  hint: {color: 'rgba(255,255,255,0.7)', marginTop: 16, fontSize: 13},
  modalBg: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24},
  modalCard: {backgroundColor: '#fff', borderRadius: 16, padding: 24},
  modalTitle: {fontSize: 18, fontWeight: '700', color: '#FF3B30', marginBottom: 12},
  modalText: {fontSize: 15, color: '#1C1C1E', marginBottom: 6},
  modalBtn: {backgroundColor: '#007AFF', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16},
  modalBtnText: {color: '#fff', fontWeight: '600', fontSize: 16},
});
