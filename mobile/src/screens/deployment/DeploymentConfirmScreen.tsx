import React, {useState} from 'react';
import {ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSessionStore} from '../../store/sessionStore';
import {useAuthStore} from '../../store/authStore';
import {enqueueAssignment} from '../../services/syncService';
import NetInfo from '@react-native-community/netinfo';
import {submitAssignment} from '../../api/sites';

export const DeploymentConfirmScreen = ({navigation, route}: any) => {
  const {unitId, siteId, devEuiRaw, devEuiNormalized} = route.params;
  const {activeUpload} = useSessionStore();
  const {email} = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    const timestampLocal = new Date().toISOString();
    const netState = await NetInfo.fetch();

    if (netState.isConnected && activeUpload) {
      try {
        await submitAssignment(activeUpload.upload_id, {
          site_id: siteId,
          unit_id: unitId,
          dev_eui_raw: devEuiRaw,
          timestamp_local: timestampLocal,
        });
        setLoading(false);
        Alert.alert('Success', `Lock assigned to unit ${unitId}`, [{text: 'Next Unit', onPress: () => navigation.popToTop()}]);
        return;
      } catch (error: any) {
        setLoading(false);
        if (error?.response?.status === 409) {
          const existing = error.response.data.existing;
          Alert.alert(
            'Conflict Detected',
            `This ${error.response.data.conflict_type === 'dev_eui' ? 'lock' : 'unit'} is already assigned.\n\nAssigned by: ${existing.technician_email}\nAt: ${new Date(existing.timestamp_local).toLocaleString()}`,
            [{text: 'OK', onPress: () => navigation.popToTop()}]
          );
          return;
        }
      }
    }

    // Offline or failed - queue locally
    if (activeUpload) {
      await enqueueAssignment({uploadId: activeUpload.upload_id, siteId, unitId, devEuiRaw, devEuiNormalized, timestampLocal});
    }
    setLoading(false);
    Alert.alert('Queued', 'Assignment saved locally. Will sync when online.', [{text: 'Next Unit', onPress: () => navigation.popToTop()}]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Assignment</Text>

      <View style={styles.card}>
        <Row label="Unit ID" value={unitId} />
        <Row label="DevEUI" value={devEuiNormalized} mono />
        <Row label="Raw" value={devEuiRaw} mono />
        <Row label="Technician" value={email || ''} />
        <Row label="Site" value={siteId} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 32}} />
      ) : (
        <>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>Confirm Assignment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Rescan Lock</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const Row = ({label, value, mono}: {label: string; value: string; mono?: boolean}) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={[rowStyles.value, mono && rowStyles.mono]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7', padding: 20},
  title: {fontSize: 24, fontWeight: '700', color: '#1C1C1E', marginBottom: 20},
  card: {backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 1},
  confirmBtn: {backgroundColor: '#34C759', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24},
  confirmBtnText: {color: '#fff', fontSize: 17, fontWeight: '700'},
  cancelBtn: {alignItems: 'center', marginTop: 12, padding: 12},
  cancelBtnText: {color: '#FF3B30', fontSize: 16},
});

const rowStyles = StyleSheet.create({
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F7'},
  label: {fontSize: 14, color: '#8E8E93', fontWeight: '500'},
  value: {fontSize: 14, color: '#1C1C1E', fontWeight: '600', maxWidth: '60%', textAlign: 'right'},
  mono: {fontFamily: 'monospace', fontSize: 13},
});
