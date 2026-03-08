import React, {useState} from 'react';
import {ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSessionStore} from '../../store/sessionStore';
import {useAuthStore} from '../../store/authStore';
import {enqueueAssignment} from '../../services/syncService';
import NetInfo from '@react-native-community/netinfo';
import {submitAssignment} from '../../api/sites';

export const DeploymentConfirmScreen = ({navigation, route}: any) => {
  const {unitId, unitName, siteId, devEuiRaw, devEuiNormalized} = route.params;
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
        Alert.alert('Success', `Lock assigned to unit ${unitId}`, [{text: 'Next Unit', onPress: () => navigation.navigate('DeploymentScanQR')}]);
        return;
      } catch (error: any) {
        setLoading(false);
        if (error?.response?.status === 409) {
          const existing = error.response.data.existing;
          Alert.alert(
            'Conflict Detected',
            `This ${error.response.data.conflict_type === 'dev_eui' ? 'lock' : 'unit'} is already assigned.\n\nAssigned by: ${existing.technician_email}\nAt: ${new Date(existing.timestamp_local).toLocaleString()}`,
            [{text: 'OK', onPress: () => navigation.navigate('DeploymentScanQR')}]
          );
          return;
        }
      }
    }

    if (activeUpload) {
      await enqueueAssignment({uploadId: activeUpload.upload_id, siteId, unitId, devEuiRaw, devEuiNormalized, timestampLocal});
    }
    setLoading(false);
    Alert.alert('Queued', 'Assignment saved locally. Will sync when online.', [{text: 'Next Unit', onPress: () => navigation.navigate('DeploymentScanQR')}]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Assignment</Text>
      <Text style={styles.subtitle}>Review the details before confirming</Text>

      <View style={styles.card}>
        <Row label="UNIT" value={unitName || unitId} highlight />
        <Row label="UNIT ID" value={unitId} />
        <Row label="DEV EUI" value={devEuiNormalized} mono />
        <Row label="RAW" value={devEuiRaw} mono />
        <Row label="TECHNICIAN" value={email || ''} />
        <Row label="SITE" value={siteId} last />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00B5A8" style={{marginTop: 32}} />
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

const Row = ({label, value, mono, highlight, last}: {label: string; value: string; mono?: boolean; highlight?: boolean; last?: boolean}) => (
  <View style={[rowStyles.row, last && rowStyles.rowLast]}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={[rowStyles.value, mono && rowStyles.mono, highlight && rowStyles.highlight]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F7', padding: 20},
  title: {fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginBottom: 4},
  subtitle: {fontSize: 14, color: '#6C6C70', marginBottom: 20},
  card: {backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, elevation: 1},
  confirmBtn: {backgroundColor: '#00B5A8', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 24},
  confirmBtnText: {color: '#fff', fontSize: 17, fontWeight: '700'},
  cancelBtn: {alignItems: 'center', marginTop: 12, padding: 12},
  cancelBtnText: {color: '#FF3B30', fontSize: 16},
});

const rowStyles = StyleSheet.create({
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F7'},
  rowLast: {borderBottomWidth: 0},
  label: {fontSize: 11, color: '#6C6C70', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', alignSelf: 'center'},
  value: {fontSize: 15, color: '#1C1C1E', fontWeight: '600', maxWidth: '60%', textAlign: 'right'},
  mono: {fontFamily: 'monospace', fontSize: 13},
  highlight: {color: '#00B5A8', fontSize: 17, fontWeight: '800'},
});
