import React, {useState} from 'react';
import {ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {initNfc, readNfcTag} from '../../services/nfc';
import {validateDevEui} from '../../services/deveui';
import {useSessionStore} from '../../store/sessionStore';
import {enqueueAssignment} from '../../services/syncService';
import NetInfo from '@react-native-community/netinfo';
import {submitAssignment} from '../../api/sites';

export const GuidedScanNFCScreen = ({navigation, route}: any) => {
  const {unit} = route.params;
  const {activeUpload} = useSessionStore();
  const [reading, setReading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const readAndSubmit = async () => {
    setReading(true);
    const ready = await initNfc();
    if (!ready) {
      Alert.alert('NFC Error', 'NFC not available');
      setReading(false);
      return;
    }
    try {
      const raw = await readNfcTag();
      const {valid, normalized, error} = validateDevEui(raw);
      if (!valid) {
        Alert.alert('Invalid DevEUI', error || 'Bad format');
        setReading(false);
        return;
      }
      setReading(false);
      setSubmitting(true);
      const timestampLocal = new Date().toISOString();
      const netState = await NetInfo.fetch();

      if (netState.isConnected && activeUpload) {
        try {
          await submitAssignment(activeUpload.upload_id, {
            site_id: unit.site_id,
            unit_id: unit.unit_id,
            dev_eui_raw: raw,
            timestamp_local: timestampLocal,
          });
          setSubmitting(false);
          navigation.goBack();
          return;
        } catch (e: any) {
          if (e?.response?.status === 409) {
            Alert.alert('Conflict', 'This lock or unit is already assigned');
            setSubmitting(false);
            return;
          }
        }
      }
      if (activeUpload) {
        await enqueueAssignment({uploadId: activeUpload.upload_id, siteId: unit.site_id, unitId: unit.unit_id, devEuiRaw: raw, devEuiNormalized: normalized, timestampLocal});
      }
      setSubmitting(false);
      navigation.goBack();
    } catch (e: any) {
      setReading(false);
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Lock NFC</Text>
      <Text style={styles.subtitle}>{unit.unit_name} ({unit.unit_id})</Text>
      <Text style={styles.seq}>Sequence #{unit.sequence}</Text>

      <View style={styles.nfcZone}>
        <Text style={styles.nfcIcon}>📡</Text>
      </View>

      {(reading || submitting) ? (
        <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 32}} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={readAndSubmit}>
          <Text style={styles.buttonText}>Read NFC Tag</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.hint}>{reading ? 'Hold phone to lock...' : submitting ? 'Submitting...' : 'Tap button then hold phone to lock'}</Text>

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back to list</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7', alignItems: 'center', padding: 24, paddingTop: 40},
  title: {fontSize: 22, fontWeight: '700', color: '#1C1C1E'},
  subtitle: {fontSize: 16, color: '#3C3C43', marginTop: 4},
  seq: {fontSize: 13, color: '#8E8E93', marginBottom: 32},
  nfcZone: {width: 140, height: 140, borderRadius: 70, backgroundColor: '#007AFF22', alignItems: 'center', justifyContent: 'center', marginBottom: 16},
  nfcIcon: {fontSize: 56},
  button: {backgroundColor: '#007AFF', borderRadius: 12, paddingHorizontal: 40, paddingVertical: 16, marginTop: 24},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  hint: {color: '#8E8E93', fontSize: 13, marginTop: 12, textAlign: 'center'},
  back: {marginTop: 20, padding: 12},
  backText: {color: '#007AFF', fontSize: 15},
});
